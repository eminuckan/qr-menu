import { NextResponse } from "next/server"

import { AdisyoRateLimitError, hasEnvAdisyoCredentials } from "@/lib/integrations/adisyo/client"
import type { AdisyoSupabaseClient } from "@/lib/integrations/adisyo/database"
import { AdisyoSyncService } from "@/lib/integrations/adisyo/sync-service"
import { createAdminClient } from "@/lib/supabase/admin"

const ADISYO_MENU_EXTERNAL_ID = "products-menu"
const DEFAULT_SYNC_TIME_ZONE = "Europe/Istanbul"
const DEFAULT_QUIET_START_HOUR = 3
const DEFAULT_QUIET_END_HOUR = 10

function readHourEnv(name: string, fallback: number) {
  const value = Number(process.env[name])

  if (Number.isInteger(value) && value >= 0 && value <= 23) {
    return value
  }

  return fallback
}

function getHourInTimeZone(timeZone: string) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone,
    }).format(new Date()),
  )
}

function getSyncWindow() {
  const requestedTimeZone = process.env.ADISYO_SYNC_TIME_ZONE ?? DEFAULT_SYNC_TIME_ZONE
  const quietStartHour = readHourEnv("ADISYO_SYNC_QUIET_START_HOUR", DEFAULT_QUIET_START_HOUR)
  const quietEndHour = readHourEnv("ADISYO_SYNC_QUIET_END_HOUR", DEFAULT_QUIET_END_HOUR)

  try {
    return {
      timeZone: requestedTimeZone,
      currentHour: getHourInTimeZone(requestedTimeZone),
      quietStartHour,
      quietEndHour,
    }
  } catch {
    return {
      timeZone: DEFAULT_SYNC_TIME_ZONE,
      currentHour: getHourInTimeZone(DEFAULT_SYNC_TIME_ZONE),
      quietStartHour,
      quietEndHour,
    }
  }
}

function isWithinQuietHours(currentHour: number, quietStartHour: number, quietEndHour: number) {
  if (quietStartHour === quietEndHour) {
    return false
  }

  if (quietStartHour < quietEndHour) {
    return currentHour >= quietStartHour && currentHour < quietEndHour
  }

  return currentHour >= quietStartHour || currentHour < quietEndHour
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return false
  }

  return request.headers.get("authorization") === `Bearer ${secret}`
    || request.headers.get("x-cron-secret") === secret
}

async function getScheduledBusinessIds(db: AdisyoSupabaseClient) {
  const businessIds = new Set<string>()

  const { data: connections, error: connectionsError } = await db
    .from("adisyo_connections")
    .select("business_id")
    .eq("provider", "adisyo")
    .eq("is_active", true)

  if (connectionsError) {
    throw connectionsError
  }

  for (const connection of connections ?? []) {
    businessIds.add(connection.business_id)
  }

  if (hasEnvAdisyoCredentials()) {
    const fallbackBusinessId = process.env.ADISYO_FALLBACK_BUSINESS_ID

    if (fallbackBusinessId) {
      businessIds.add(fallbackBusinessId)
    }

    const { data: mappedBusinesses, error: mappedBusinessesError } = await db
      .from("adisyo_sync_mappings")
      .select("business_id")
      .eq("provider", "adisyo")
      .eq("entity_type", "menu")
      .eq("external_id", ADISYO_MENU_EXTERNAL_ID)
      .eq("is_active", true)

    if (mappedBusinessesError) {
      throw mappedBusinessesError
    }

    for (const mapping of mappedBusinesses ?? []) {
      businessIds.add(mapping.business_id)
    }
  }

  return [...businessIds]
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const syncWindow = getSyncWindow()
  if (isWithinQuietHours(syncWindow.currentHour, syncWindow.quietStartHour, syncWindow.quietEndHour)) {
    return NextResponse.json({
      checked: 0,
      skipped: true,
      reason: "quiet_hours",
      timeZone: syncWindow.timeZone,
      currentHour: syncWindow.currentHour,
      quietStartHour: syncWindow.quietStartHour,
      quietEndHour: syncWindow.quietEndHour,
      results: [],
    })
  }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for scheduled Adisyo sync." },
      { status: 500 },
    )
  }

  const db = adminSupabase as unknown as AdisyoSupabaseClient
  let businessIds: string[] = []

  try {
    businessIds = await getScheduledBusinessIds(db)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resolve scheduled businesses." },
      { status: 500 },
    )
  }

  const service = new AdisyoSyncService(adminSupabase, adminSupabase)
  const results = []

  for (const businessId of businessIds) {
    try {
      const result = await service.syncProducts({
        businessId,
        trigger: "scheduled",
        skipMembershipCheck: true,
      })

      results.push({
        businessId,
        status: "succeeded",
        runId: result.runId,
        stats: result.stats,
      })
    } catch (error) {
      results.push({
        businessId,
        status: error instanceof AdisyoRateLimitError ? "rate_limited" : "failed",
        message: error instanceof Error ? error.message : "Unknown scheduled sync error",
        retryAfterSeconds: error instanceof AdisyoRateLimitError ? error.retryAfterSeconds : undefined,
      })
    }
  }

  return NextResponse.json({
    checked: businessIds.length,
    results,
  })
}
