"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserLocation {
  lat: number
  lng: number
}

interface UseUserLocationResult {
  location: UserLocation | null
  loading: boolean
  error: string | null
}

// 7 days in milliseconds for refresh cycle
const REFRESH_INTERVAL = 7 * 24 * 60 * 60 * 1000

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    const getIPLocation = async (): Promise<UserLocation | null> => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          console.error("[Location] IP API failed:", response.status)
          return null
        }

        const data = await response.json()

        if (data.error) {
          console.error("[Location] IP API error:", data.reason || "Unknown")
          return null
        }

        if (data.latitude && data.longitude) {
          return { lat: data.latitude, lng: data.longitude }
        }
        return null
      } catch (err) {
        return null
      }
    }

    const saveLocationToSupabase = async (userId: string, loc: UserLocation) => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            latitude: loc.lat,
            longitude: loc.lng,
            location_updated_at: new Date().toISOString(),
          })
          .eq("id", userId)

        if (error) {
          console.error("[Location] Failed to save to Supabase:", error.message)
        }
      } catch (err) {
        console.error("[Location] Error saving location:", err)
      }
    }

    const detectLocation = async () => {
      try {
        // Check if user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          console.error("[Location] Auth error:", authError.message)
          // Fallback to default map if auth fails
          if (isMounted) {
            setLocation(null)
            setLoading(false)
          }
          return
        }

        if (!user) {
          // Not logged in - show default US map, don't use API
          if (isMounted) {
            setLocation(null)
            setLoading(false)
          }
          return
        }

        // User is logged in - check for stored location in profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("latitude, longitude, location_updated_at")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("[Location] Profile fetch error:", profileError.message)
        }

        const hasStoredLocation = profile?.latitude && profile?.longitude
        const locationUpdatedAt = profile?.location_updated_at ? new Date(profile.location_updated_at).getTime() : 0
        const now = Date.now()
        const needsRefresh = !locationUpdatedAt || (now - locationUpdatedAt > REFRESH_INTERVAL)

        if (hasStoredLocation && !needsRefresh) {
          // Use stored location (less than 7 days old)
          if (isMounted) {
            setLocation({ lat: profile.latitude, lng: profile.longitude })
            setLoading(false)
          }
          return
        }

        if (hasStoredLocation && needsRefresh) {
          // Location exists but needs refresh - use it immediately, then update in background
          if (isMounted) {
            setLocation({ lat: profile.latitude, lng: profile.longitude })
            setLoading(false)
          }

          // Background refresh
          const newLocation = await getIPLocation()
          if (newLocation && isMounted) {
            setLocation(newLocation)
            await saveLocationToSupabase(user.id, newLocation)
          }
          return
        }

        // No stored location - get from IP API and save
        const ipLocation = await getIPLocation()
        
        if (ipLocation) {
          if (isMounted) {
            setLocation(ipLocation)
            setLoading(false)
          }
          await saveLocationToSupabase(user.id, ipLocation)
        } else {
          // No location available
          if (isMounted) {
            setLocation(null)
            setError("Could not detect location")
            setLoading(false)
          }
        }
      } catch (err) {
        console.error("[Location] Error detecting location:", err)
      }
    }

    detectLocation()

    return () => {
      isMounted = false
    }
  }, [])

  return { location, loading, error }
}
