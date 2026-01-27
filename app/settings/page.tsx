import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { AccountSettings } from "@/components/account-settings"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get supplier data if user is a grower or broker
  let supplier = null
  if (profile?.account_type === "grower" || profile?.account_type === "broker") {
    const { data } = await supabase.from("suppliers").select("*").eq("user_id", user.id).maybeSingle()
    supplier = data
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        <AccountSettings user={user} profile={profile} supplier={supplier} />
      </main>
    </div>
  )
}
