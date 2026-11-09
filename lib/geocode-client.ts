// This works with HTTP referrer-restricted API keys

export interface GeocodeResult {
  success: boolean
  latitude: number | null
  longitude: number | null
  formattedAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  error?: string
}

export async function geocodeAddressClient(
  address: string,
  city: string,
  state: string,
  zipCode: string,
): Promise<GeocodeResult> {
  try {
    // Wait for Google Maps to load
    if (typeof window === "undefined" || !window.google) {
      return {
        success: false,
        latitude: null,
        longitude: null,
        error: "Google Maps not loaded",
      }
    }

    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`

    const geocoder = new window.google.maps.Geocoder()

    return new Promise((resolve) => {
      geocoder.geocode({ address: fullAddress }, (results: any, status: string) => {
        if (status === "OK" && results && results[0]) {
          if (results[0].partial_match) {
            resolve({
              success: false,
              latitude: null,
              longitude: null,
              error: "Address is incomplete or ambiguous. Please provide a complete, valid street address.",
            })
            return
          }

          const location = results[0].geometry.location
          const lat = location.lat()
          const lng = location.lng()

          const addressComponents = results[0].address_components
          let street = ""
          let formattedCity = ""
          let formattedState = ""
          let formattedZip = ""

          // Parse address components
          for (const component of addressComponents) {
            const types = component.types

            if (types.includes("street_number")) {
              street = component.long_name + " "
            } else if (types.includes("route")) {
              street += component.short_name
            } else if (types.includes("locality")) {
              formattedCity = component.long_name
            } else if (types.includes("administrative_area_level_1")) {
              formattedState = component.short_name
            } else if (types.includes("postal_code")) {
              formattedZip = component.short_name
            }
          }

          const cityMatches = formattedCity.toLowerCase() === city.toLowerCase()
          const stateMatches = formattedState.toLowerCase() === state.toLowerCase()
          const zipMatches = formattedZip === zipCode

          if (!cityMatches || !stateMatches || !zipMatches) {
            const mismatches = []
            if (!cityMatches) mismatches.push(`city (found: ${formattedCity})`)
            if (!stateMatches) mismatches.push(`state (found: ${formattedState})`)
            if (!zipMatches) mismatches.push(`ZIP code (found: ${formattedZip})`)

            resolve({
              success: false,
              latitude: null,
              longitude: null,
              error: `Address validation failed: ${mismatches.join(", ")} doesn't match. Please verify your address.`,
            })
            return
          }

          resolve({
            success: true,
            latitude: lat,
            longitude: lng,
            formattedAddress: {
              street: street.trim(),
              city: formattedCity,
              state: formattedState,
              zipCode: formattedZip,
            },
          })
        } else {
          resolve({
            success: false,
            latitude: null,
            longitude: null,
            error: `Geocoding failed: ${status}`,
          })
        }
      })
    })
  } catch (error) {
    console.error("Geocoding error:", error)
    return {
      success: false,
      latitude: null,
      longitude: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Pages without a map (e.g. the dashboard opened directly) never load the Maps script,
// so inject the same script MapView uses; MapView reuses it when the key matches.
function ensureGoogleMapsScript() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey || (window as any).google?.maps) return
  if (document.querySelector('script[src*="maps.googleapis.com"]')) return

  const script = document.createElement("script")
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async`
  script.async = true
  script.defer = true
  document.head.appendChild(script)
}

// Helper to ensure Google Maps is loaded before geocoding
export async function waitForGoogleMaps(maxWaitMs = 10000): Promise<boolean> {
  if (typeof window === "undefined") return false

  ensureGoogleMapsScript()
  const startTime = Date.now()

  while (!(window as any).google?.maps?.Geocoder) {
    const maps = (window as any).google?.maps
    if (maps?.importLibrary) {
      try {
        await maps.importLibrary("geocoding")
        if ((window as any).google?.maps?.Geocoder) break
      } catch {
        // fall through to retry until timeout
      }
    }
    if (Date.now() - startTime > maxWaitMs) {
      return false
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return true
}
