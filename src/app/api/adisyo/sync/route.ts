import { NextResponse } from "next/server"
import { z } from "zod"

import { AdisyoRateLimitError } from "@/lib/integrations/adisyo/client"
import { AdisyoSyncService } from "@/lib/integrations/adisyo/sync-service"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const syncRequestSchema = z.object({
  businessId: z.string().uuid(),
  menuId: z.string().uuid().nullable().optional(),
  force: z.boolean().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = syncRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sync request", issues: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await new AdisyoSyncService(supabase, createAdminClient()).syncProducts({
      businessId: parsed.data.businessId,
      menuId: parsed.data.menuId ?? null,
      userId: user.id,
      trigger: "manual",
      force: parsed.data.force ?? false,
    })

    return NextResponse.json(result)
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
      {
        error: "sync_failed",
        message: error instanceof Error ? error.message : "Adisyo senkronizasyonu başarısız oldu.",
      },
      { status: 500 },
    )
  }
}
