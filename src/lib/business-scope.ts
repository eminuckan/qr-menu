import "server-only"

import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/types/supabase"
import { SELECTED_BUSINESS_COOKIE, type ScopedBusiness } from "@/lib/business-scope.shared"

type BusinessUserRow = {
  role: string | null
  businesses: Pick<Database["public"]["Tables"]["businesses"]["Row"], "id" | "name" | "slug" | "updated_at"> | null
}

export async function getBusinessScope(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("business_users")
    .select("role,businesses(id,name,slug,updated_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<BusinessUserRow[]>()

  const businesses: ScopedBusiness[] = (data ?? [])
    .filter((row): row is BusinessUserRow & { businesses: NonNullable<BusinessUserRow["businesses"]> } => Boolean(row.businesses))
    .map((row) => ({
      ...row.businesses,
      role: row.role ?? "member",
    }))

  const cookieStore = await cookies()
  const requestedBusinessId = cookieStore.get(SELECTED_BUSINESS_COOKIE)?.value ?? null
  const selectedBusinessId = businesses.some((business) => business.id === requestedBusinessId)
    ? requestedBusinessId
    : businesses[0]?.id ?? null
  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId) ?? null

  return {
    businesses,
    selectedBusiness,
    selectedBusinessId,
    error,
  }
}
