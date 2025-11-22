import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { SupplierProfile } from "@/components/supplier-profile"
import { InventoryList } from "@/components/inventory-list"
import { SetupSupplierProfile } from "@/components/setup-supplier-profile"

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

  // Check if user is a supplier
  if (profile?.user_type !== "supplier") {
    redirect("/")
  }

  // Get supplier info
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("user_id", user.id).single()

  // Get inventory if supplier profile exists
  let inventory = []
  if (supplier) {
    const { data: inventoryData } = await supabase
      .from("inventory")
      .select("*")
      .eq("supplier_id", supplier.id)
      .order("created_at", { ascending: false })
    inventory = inventoryData || []
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Dashboard</h1>
          <p className="text-gray-600">Manage your business profile and inventory</p>
        </div>

        {!supplier ? (
          <SetupSupplierProfile userId={user.id} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <SupplierProfile supplier={supplier} userId={user.id} />
            </div>
            <div className="lg:col-span-2">
              <InventoryList inventory={inventory} supplierId={supplier.id} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
