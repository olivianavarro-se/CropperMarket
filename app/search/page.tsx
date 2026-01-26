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
    const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", user.id).single()
    userType = profile?.account_type || null
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
    if (!hasInventory) return false

    const supplier = location.supplier
    if (!supplier) return false

    if (userType === "buyer") {
      return supplier.visible_to_buyers
    } else if (userType === "broker") {
      return supplier.visible_to_brokers
    }
    return true
  })

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      <Header />
      <main className="flex-1">
        <SearchInterface locations={locationsWithInventory || []} isAuthenticated={isAuthenticated} />
      </main>
    </div>
  )
}
