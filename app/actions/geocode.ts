"use server"

export async function geocodeAddress(address: string, city: string, state: string, zipCode: string) {
  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`.trim()

  console.log("[v0] Geocoding request:", { address, city, state, zipCode, fullAddress })

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
    console.log(
      "[v0] Geocoding URL:",
      geocodeUrl.replace(process.env.GOOGLE_MAPS_SERVER_API_KEY || "", "API_KEY_HIDDEN"),
    )

    const response = await fetch(geocodeUrl)
    const data = await response.json()

    console.log("[v0] Geocoding response status:", data.status)
    console.log("[v0] Geocoding response:", JSON.stringify(data, null, 2))

    if (data.results && data.results[0]) {
      const result = {
        latitude: data.results[0].geometry.location.lat,
        longitude: data.results[0].geometry.location.lng,
        success: true,
      }
      console.log("[v0] Geocoding successful:", result)
      return result
    }

    console.log("[v0] Geocoding failed - no results found")
    return { success: false, latitude: null, longitude: null }
  } catch (error) {
    console.error("[v0] Geocoding error:", error)
    return { success: false, latitude: null, longitude: null }
  }
}
