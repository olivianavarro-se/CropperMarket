import { createClient } from "@/lib/supabase/server"
import { MapView } from "@/components/map-view"
import { Header } from "@/components/header"

export default async function Home() {
  const supabase = await createClient()

  // Fetch all suppliers with their inventory
  const { data: suppliers } = await supabase.from("suppliers").select(`
      *,
      inventory (*)
    `)

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 relative">
        <MapView suppliers={suppliers || []} />
      </main>
    </div>
  )
}
