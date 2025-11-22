"use server"

export async function geocodeAddress(address: string, city: string, state: string, zipCode: string) {
  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`.trim()

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    const response = await fetch(geocodeUrl)
    const data = await response.json()

    if (data.results && data.results[0]) {
      return {
        latitude: data.results[0].geometry.location.lat,
        longitude: data.results[0].geometry.location.lng,
        success: true,
      }
    }

    return { success: false, latitude: null, longitude: null }
  } catch (error) {
    console.error("Geocoding error:", error)
    return { success: false, latitude: null, longitude: null }
  }
}
