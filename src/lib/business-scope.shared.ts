import type { Database } from "@/lib/types/supabase"

export const SELECTED_BUSINESS_COOKIE = "qr_selected_business_id"

export type ScopedBusiness = Pick<
  Database["public"]["Tables"]["businesses"]["Row"],
  "id" | "name" | "slug" | "updated_at"
> & {
  role: string
}
