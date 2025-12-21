import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { SearchInterface } from "@/components/search-interface"

export default async function SearchPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  let userType: string | null = null
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()
    userType = profile?.user_type || null
  }

  // Fetch all suppliers with their inventory
  let query = supabase
    .from("suppliers")
    .select(`
      *,
      inventory (*)
    `)
    .not("inventory", "is", null)

  if (userType === "buyer") {
    query = query.eq("visible_to_buyers", true)
  } else if (userType === "broker") {
    query = query.eq("visible_to_brokers", true)
  }
  // Growers and unauthenticated users see all suppliers

  const { data: suppliers } = await query

  // Filter suppliers that have at least one inventory item
  const suppliersWithInventory = suppliers?.filter((supplier) => supplier.inventory && supplier.inventory.length > 0)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      <Header />
      <main className="flex-1">
        <SearchInterface suppliers={suppliersWithInventory || []} isAuthenticated={isAuthenticated} />
      </main>
    </div>
  )
}
