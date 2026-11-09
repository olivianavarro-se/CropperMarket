"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function deleteAccount() {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Delete supplier's inventory if exists
    const { data: supplier } = await supabase.from("suppliers").select("id").eq("user_id", user.id).maybeSingle()

    if (supplier) {
      await supabase.from("inventory").delete().eq("supplier_id", supplier.id)
      await supabase.from("suppliers").delete().eq("user_id", user.id)
    }

    // Delete profile
    await supabase.from("profiles").delete().eq("id", user.id)

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      throw new Error("Service role key not configured")
    }

    // Call the admin delete endpoint directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete auth user")
    }

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    // Remove all Supabase auth cookies
    allCookies.forEach((cookie) => {
      if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
        cookieStore.delete(cookie.name)
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error("Delete account error:", error)
    return { success: false, error: error.message || "Failed to delete account" }
  }
}
