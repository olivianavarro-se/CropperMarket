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
  let userSupplierId: string | null = null
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", user.id).single()
    userType = profile?.account_type || null
    
    // Check if user owns a supplier/farm
    const { data: supplier } = await supabase.from("suppliers").select("id").eq("user_id", user.id).maybeSingle()
    userSupplierId = supplier?.id || null
  }

  const query = supabase
    .from("locations")
    .select(`
      *,
      supplier:suppliers (*),
      inventory (*)
    `)
    .order("product_name", { ascending: true, referencedTable: "inventory" })

  const { data: locationsData } = await query

  // Filter locations based on user visibility settings and inventory
  const locationsWithInventory = locationsData?.filter((location) => {
    const hasInventory = location.inventory && location.inventory.length > 0
    // Squeeze and transport are add-ons of a farm, so a location only appears once it lists hay.
    if (!hasInventory) return false

    const supplier = location.supplier
    if (!supplier) return false

    if (userType === "buyer") {
      return supplier.visible_to_buyers
    } else if (userType === "broker") {
      return supplier.visible_to_brokers
    }
    // Growers and unauthenticated users see all locations
    return true
  })

  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] flex flex-col overflow-hidden md:bottom-0">
      <Header />
      <main className="flex-1 relative overflow-hidden">
        <HomeMapView 
          locations={locationsWithInventory || []} 
          isAuthenticated={isAuthenticated} 
          userId={user?.id}
          userSupplierId={userSupplierId}
        />
      </main>
    </div>
  )
}
