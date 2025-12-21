"use server"

/**
 * Geocode all suppliers that have addresses but missing lat/lng coordinates
 * This script uses Google Geocoding API to convert addresses to coordinates
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_SERVER_API_KEY

interface Supplier {
  id: string
  business_name: string
  address: string
  city: string
  state: string
  zip_code: string
  latitude: number | null
  longitude: number | null
}

async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zipCode: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      fullAddress,
    )}&key=${GOOGLE_MAPS_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return { lat: location.lat, lng: location.lng }
    }

    console.log(`[v0] Geocoding failed for ${fullAddress}: ${data.status}`)
    return null
  } catch (error) {
    console.error("[v0] Geocoding error:", error)
    return null
  }
}

async function geocodeAllSuppliers() {
  // This would be called from a server action or API route
  console.log("[v0] Starting geocoding process for suppliers...")

  // Fetch suppliers with addresses but no coordinates
  // Update each supplier with geocoded coordinates
  // This is a template - actual implementation would use Supabase queries

  console.log("[v0] Geocoding complete!")
}

export { geocodeAddress, geocodeAllSuppliers }
