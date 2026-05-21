import { NextResponse } from "next/server"
import { z } from "zod"

import { AdisyoClient, AdisyoRateLimitError, hasEnvAdisyoCredentials, type AdisyoCredentials } from "@/lib/integrations/adisyo/client"
import type { AdisyoSupabaseClient } from "@/lib/integrations/adisyo/database"
import { encryptAdisyoSecret } from "@/lib/integrations/adisyo/secrets"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const connectionQuerySchema = z.object({
  businessId: z.string().uuid(),
})

const connectionSaveSchema = z.object({
  businessId: z.string().uuid(),
  restaurantIdentity: z.string().trim().max(120).optional().nullable(),
  apiKey: z.string().trim().min(1),
  apiSecret: z.string().trim().min(1),
  apiConsumer: z.string().trim().min(1),
  validate: z.boolean().optional(),
})

async function getSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

async function assertMembership(businessId: string) {
  const { supabase, user } = await getSession()

  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data, error } = await supabase
    .from("business_users")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return { ok: false as const, response: NextResponse.json({ error: error.message }, { status: 500 }) }
  }

  if (!data) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { ok: true as const, userId: user.id }
}

function adminDb() {
  const admin = createAdminClient()

  if (!admin) {
    return null
  }

  return admin as unknown as AdisyoSupabaseClient
}

function connectionPayload(credentials: AdisyoCredentials) {
  return {
    api_key: encryptAdisyoSecret(credentials.apiKey),
    api_secret: encryptAdisyoSecret(credentials.apiSecret),
    api_consumer: encryptAdisyoSecret(credentials.apiConsumer),
  }
}

function isMissingRelation(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.message?.includes("does not exist")
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = connectionQuerySchema.safeParse({
    businessId: url.searchParams.get("businessId"),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connection request" }, { status: 400 })
  }

  const membership = await assertMembership(parsed.data.businessId)
  if (!membership.ok) {
    return membership.response
  }

  const db = adminDb()
  if (!db) {
    return NextResponse.json({
      connection: null,
      fallbackConfigured: hasEnvAdisyoCredentials(),
      canManageConnection: false,
      migrationMissing: false,
    })
  }

  const { data, error } = await db
    .from("adisyo_connections")
    .select("id,business_id,restaurant_identity,is_active,last_verified_at,created_at,updated_at")
    .eq("business_id", parsed.data.businessId)
    .eq("provider", "adisyo")
    .maybeSingle()

  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json({
        connection: null,
        fallbackConfigured: hasEnvAdisyoCredentials(),
        canManageConnection: false,
        migrationMissing: true,
      })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    connection: data
      ? {
        id: data.id,
        businessId: data.business_id,
        restaurantIdentity: data.restaurant_identity,
        isActive: data.is_active,
        lastVerifiedAt: data.last_verified_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        hasCredentials: true,
      }
      : null,
    fallbackConfigured: hasEnvAdisyoCredentials(),
    canManageConnection: true,
    migrationMissing: false,
  })
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = connectionSaveSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connection request", issues: parsed.error.flatten() }, { status: 400 })
  }

  const membership = await assertMembership(parsed.data.businessId)
  if (!membership.ok) {
    return membership.response
  }

  const credentials = {
    apiKey: parsed.data.apiKey,
    apiSecret: parsed.data.apiSecret,
    apiConsumer: parsed.data.apiConsumer,
  }

  if (parsed.data.validate) {
    try {
      await new AdisyoClient().getProducts(credentials)
    } catch (error) {
      if (error instanceof AdisyoRateLimitError) {
        return NextResponse.json(
          {
            error: "rate_limit",
            message: `Adisyo /Products ${error.retryAfterSeconds} saniye sonra tekrar çağrılabilir.`,
            retryAfterSeconds: error.retryAfterSeconds,
          },
          { status: 429 },
        )
      }

      return NextResponse.json(
        { error: "connection_test_failed", message: error instanceof Error ? error.message : "Adisyo bağlantısı doğrulanamadı." },
        { status: 400 },
      )
    }
  }

  const db = adminDb()
  if (!db) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for Adisyo connections." }, { status: 500 })
  }

  const now = new Date().toISOString()
  const { data: existing, error: existingError } = await db
    .from("adisyo_connections")
    .select("last_verified_at")
    .eq("business_id", parsed.data.businessId)
    .eq("provider", "adisyo")
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  const { error } = await db
    .from("adisyo_connections")
    .upsert({
      business_id: parsed.data.businessId,
      provider: "adisyo",
      restaurant_identity: parsed.data.restaurantIdentity || null,
      ...connectionPayload(credentials),
      is_active: true,
      last_verified_at: parsed.data.validate ? now : existing?.last_verified_at ?? null,
      created_by: membership.userId,
      updated_at: now,
    }, {
      onConflict: "business_id,provider",
    })

  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json(
        { error: "migration_missing", message: "Adisyo migration has not been applied to Supabase yet." },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, validated: Boolean(parsed.data.validate) })
}

export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const parsed = connectionQuerySchema.safeParse({
    businessId: url.searchParams.get("businessId"),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connection request" }, { status: 400 })
  }

  const membership = await assertMembership(parsed.data.businessId)
  if (!membership.ok) {
    return membership.response
  }

  const db = adminDb()
  if (!db) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for Adisyo connections." }, { status: 500 })
  }

  const { error } = await db
    .from("adisyo_connections")
    .delete()
    .eq("business_id", parsed.data.businessId)
    .eq("provider", "adisyo")

  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json(
        { error: "migration_missing", message: "Adisyo migration has not been applied to Supabase yet." },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
