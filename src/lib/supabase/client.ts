import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types/supabase'
import { getSupabaseConfig } from './config'

export function createClient() {
  const { url, publishableKey } = getSupabaseConfig()

  return createBrowserClient<Database>(url, publishableKey)
}
