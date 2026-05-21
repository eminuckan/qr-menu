import { NextResponse } from "next/server"

import type { AdisyoSupabaseClient } from "@/lib/integrations/adisyo/database"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/types/supabase"

type WebhookPayload = Record<string, unknown>

function optionalSecretMatches(request: Request) {
  const secret = process.env.ADISYO_WEBHOOK_SECRET

  if (!secret) {
    return true
  }

  return request.headers.get("authorization") === `Bearer ${secret}`
    || request.headers.get("x-adisyo-webhook-secret") === secret
    || request.headers.get("x-webhook-secret") === secret
}

function textField(payload: WebhookPayload, keys: string[]) {
  for (const key of keys) {
    const value = payload[key]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }

    if (typeof value === "number") {
      return String(value)
    }
  }

  return null
}

function timestampField(payload: WebhookPayload) {
  const value = textField(payload, ["eventTimeUtc", "event_time_utc", "eventTime", "createdAt", "created_at"])

  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function businessIdFromUrl(request: Request) {
  const businessId = new URL(request.url).searchParams.get("businessId")

  return businessId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId)
    ? businessId
    : null
}

function json(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json
}

export async function POST(request: Request) {
  if (!optionalSecretMatches(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for Adisyo webhooks." },
      { status: 500 },
    )
  }

  const payload = await request.json().catch(() => null) as WebhookPayload | null
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
  }

  const eventType = textField(payload, ["eventType", "event_type", "type", "name"])
  if (!eventType) {
    return NextResponse.json({ error: "Webhook event type is required" }, { status: 400 })
  }

  const eventId = textField(payload, ["eventId", "event_id", "id"])
    ?? `${eventType}:${timestampField(payload) ?? Date.now()}:${crypto.randomUUID()}`
  const restaurantIdentity = textField(payload, [
    "restaurantIdentity",
    "restaurant_identity",
    "restaurantId",
    "restaurant_id",
    "consumer",
  ])

  const db = adminSupabase as unknown as AdisyoSupabaseClient
  let businessId = businessIdFromUrl(request)

  if (!businessId && restaurantIdentity) {
    const { data, error } = await db
      .from("adisyo_connections")
      .select("business_id")
      .eq("provider", "adisyo")
      .eq("restaurant_identity", restaurantIdentity)
      .eq("is_active", true)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    businessId = data?.business_id ?? null
  }

  const { error } = await db
    .from("adisyo_webhook_events")
    .upsert({
      event_id: eventId,
      business_id: businessId,
      restaurant_identity: restaurantIdentity,
      event_type: eventType,
      event_time_utc: timestampField(payload),
      status: "received",
      payload: json(payload),
    }, {
      onConflict: "event_id",
      ignoreDuplicates: true,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
