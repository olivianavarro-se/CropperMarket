import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { SetupSupplierProfile } from "@/components/setup-supplier-profile"
import { DashboardTabs } from "@/components/dashboard-tabs"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.account_type !== "grower" && profile?.account_type !== "broker") {
    redirect("/")
  }

  // Get supplier info
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("user_id", user.id).maybeSingle()

  let locations = []
  if (supplier) {
    const { data: locationsData } = await supabase
      .from("locations")
      .select(`
        *,
        inventory (*)
      `)
      .eq("supplier_id", supplier.id)
      .order("created_at", { ascending: false })
      .order("product_name", { ascending: true, referencedTable: "inventory" })

    locations = locationsData || []
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Dashboard</h1>
          <p className="text-gray-600">Manage your business profile, locations, inventory, calendar, and orders</p>
        </div>

        {!supplier ? (
          <SetupSupplierProfile userId={user.id} />
        ) : (
          <DashboardTabs supplier={supplier} userId={user.id} locations={locations} />
        )}
      </main>
    </div>
  )
}
