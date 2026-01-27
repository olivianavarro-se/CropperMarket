import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { HomeMapView } from "@/components/home-map-view"

export default async function Home() {
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
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 relative">
        <HomeMapView suppliers={suppliersWithInventory || []} isAuthenticated={isAuthenticated} />
      </main>
    </div>
  )
}
