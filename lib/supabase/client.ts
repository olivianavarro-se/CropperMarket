import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

declare global {
  interface Window {
    __supabase_client?: SupabaseClient
  }
}

export function createClient() {
  if (typeof window !== "undefined" && window.__supabase_client) {
    return window.__supabase_client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || supabaseUrl.trim() === "") {
    console.error("[v0] NEXT_PUBLIC_SUPABASE_URL is missing or empty")
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }

  if (!supabaseAnonKey || supabaseAnonKey.trim() === "") {
    console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty")
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
  }

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey)

  if (typeof window !== "undefined") {
    window.__supabase_client = client
  }

  return client
}
