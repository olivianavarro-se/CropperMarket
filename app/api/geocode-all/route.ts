import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_SERVER_API_KEY

export async function POST() {
  try {
    const supabase = await createClient()

    // Fetch all suppliers with addresses but missing coordinates
    const { data: suppliers, error: fetchError } = await supabase
      .from("suppliers")
      .select("id, business_name, address, city, state, zip_code, latitude, longitude")
      .not("address", "is", null)
      .is("latitude", null)

    if (fetchError) {
      console.error("[v0] Error fetching suppliers:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!suppliers || suppliers.length === 0) {
      return NextResponse.json({
        message: "No suppliers need geocoding",
        geocoded: 0,
      })
    }

    console.log(`[v0] Found ${suppliers.length} suppliers to geocode`)

    let successCount = 0
    let failCount = 0

    // Geocode each supplier
    for (const supplier of suppliers) {
      const fullAddress = `${supplier.address}, ${supplier.city}, ${supplier.state} ${supplier.zip_code}`

      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          fullAddress,
        )}&key=${GOOGLE_MAPS_API_KEY}`

        const response = await fetch(url)
        const data = await response.json()

        if (data.status === "OK" && data.results.length > 0) {
          const location = data.results[0].geometry.location

          // Update supplier with coordinates
          const { error: updateError } = await supabase
            .from("suppliers")
            .update({
              latitude: location.lat,
              longitude: location.lng,
            })
            .eq("id", supplier.id)

          if (updateError) {
            console.error(`[v0] Error updating ${supplier.business_name}:`, updateError)
            failCount++
          } else {
            console.log(`[v0] Geocoded ${supplier.business_name}: ${location.lat}, ${location.lng}`)
            successCount++
          }
        } else {
          console.log(`[v0] Geocoding failed for ${supplier.business_name}: ${data.status}`)
          failCount++
        }

        // Rate limit: wait 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`[v0] Error geocoding ${supplier.business_name}:`, error)
        failCount++
      }
    }

    return NextResponse.json({
      message: "Geocoding complete",
      total: suppliers.length,
      success: successCount,
      failed: failCount,
    })
  } catch (error) {
    console.error("[v0] Geocoding error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
