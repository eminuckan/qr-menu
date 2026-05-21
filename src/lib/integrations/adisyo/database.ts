import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, Json } from "@/lib/types/supabase"

type Table<Row extends Record<string, unknown>> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

type SyncRun = {
  id: string
  business_id: string
  menu_id: string | null
  status: "running" | "succeeded" | "failed"
  trigger: "manual" | "scheduled" | "webhook" | "system"
  started_at: string
  finished_at: string | null
  totals: Json
  error: string | null
  created_by: string | null
}

type SyncState = {
  business_id: string
  provider: string
  endpoint: string
  last_attempt_at: string | null
  last_success_at: string | null
  next_allowed_at: string | null
  last_status: string | null
  last_error: string | null
  last_run_id: string | null
  updated_at: string
}

type SyncMapping = {
  id: string
  business_id: string
  provider: string
  entity_type: "menu" | "category" | "product" | "product_price"
  external_id: string
  local_table: string
  local_id: string
  first_seen_run_id: string | null
  last_seen_run_id: string | null
  first_seen_at: string
  last_seen_at: string
  is_active: boolean
  source_payload: Json
}

type AdisyoConnection = {
  id: string
  business_id: string
  provider: string
  restaurant_identity: string | null
  api_key: string
  api_secret: string
  api_consumer: string
  is_active: boolean
  last_verified_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

type WebhookEvent = {
  id: string
  event_id: string
  business_id: string | null
  restaurant_identity: string | null
  event_type: string
  event_time_utc: string | null
  status: "received" | "processed" | "ignored" | "failed"
  payload: Json
  received_at: string
  processed_at: string | null
  error: string | null
}

export type AdisyoDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & {
      adisyo_sync_runs: Table<SyncRun>
      adisyo_sync_state: Table<SyncState>
      adisyo_sync_mappings: Table<SyncMapping>
      adisyo_connections: Table<AdisyoConnection>
      adisyo_webhook_events: Table<WebhookEvent>
    }
    Functions: Database["public"]["Functions"] & {
      cleanup_adisyo_unmapped_snapshot_entities: {
        Args: {
          p_business_id: string
          p_menu_id: string
          p_run_id: string
        }
        Returns: Json
      }
      sync_adisyo_products_snapshot: {
        Args: {
          p_business_id: string
          p_menu_id: string
          p_run_id: string
          p_payload: Json
        }
        Returns: Json
      }
    }
  }
}

export type AdisyoSupabaseClient = SupabaseClient<AdisyoDatabase>
