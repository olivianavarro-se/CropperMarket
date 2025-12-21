"use client"

import { useState, useEffect } from "react"

interface UserLocation {
  lat: number
  lng: number
}

interface UseUserLocationResult {
  location: UserLocation | null
  loading: boolean
  error: string | null
}

// Default location: Geographic center of United States
const DEFAULT_LOCATION: UserLocation = { lat: 39.8283, lng: -98.5795 }

const CACHE_KEY = "cropper_ip_location"
const RATE_LIMIT_KEY = "cropper_ip_rate_limited"
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const getCachedIPLocation = (): UserLocation | null => {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (!cached) return null

        const { location, timestamp } = JSON.parse(cached)
        const now = Date.now()

        // Check if cache is still valid (within 24 hours)
        if (now - timestamp < CACHE_DURATION) {
          console.log("[v0] Using cached IP location")
          return location
        }

        // Cache expired, remove it
        localStorage.removeItem(CACHE_KEY)
        return null
      } catch (err) {
        // If cache is corrupted, remove it
        localStorage.removeItem(CACHE_KEY)
        return null
      }
    }

    const isRateLimited = (): boolean => {
      try {
        const rateLimitData = localStorage.getItem(RATE_LIMIT_KEY)
        if (!rateLimitData) return false

        const { timestamp } = JSON.parse(rateLimitData)
        const now = Date.now()

        // Rate limit flag expires after 1 hour
        if (now - timestamp < 60 * 60 * 1000) {
          return true
        }

        // Rate limit period expired, remove flag
        localStorage.removeItem(RATE_LIMIT_KEY)
        return false
      } catch (err) {
        localStorage.removeItem(RATE_LIMIT_KEY)
        return false
      }
    }

    const setRateLimited = () => {
      try {
        localStorage.setItem(
          RATE_LIMIT_KEY,
          JSON.stringify({
            timestamp: Date.now(),
          }),
        )
      } catch (err) {
        // Silently fail if localStorage is unavailable
      }
    }

    const cacheIPLocation = (location: UserLocation) => {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            location,
            timestamp: Date.now(),
          }),
        )
      } catch (err) {
        // Silently fail if localStorage is unavailable
        console.log("[v0] Could not cache IP location")
      }
    }

    const getIPLocation = async (): Promise<UserLocation | null> => {
      const cached = getCachedIPLocation()
      if (cached) return cached

      if (isRateLimited()) {
        console.log("[v0] IP geolocation skipped (rate limited), using default location")
        return null
      }

      try {
        const response = await fetch("https://ipapi.co/json/")

        if (!response.ok) {
          if (response.status === 429) {
            setRateLimited()
            console.log("[v0] IP geolocation rate limited, will retry in 1 hour")
          } else {
            console.log("[v0] IP geolocation API failed with status:", response.status)
          }
          return null
        }

        const data = await response.json()

        if (data.error) {
          console.log("[v0] IP geolocation unavailable, using default location")
          return null
        }

        if (data.latitude && data.longitude) {
          const ipLocation = { lat: data.latitude, lng: data.longitude }
          cacheIPLocation(ipLocation)
          return ipLocation
        }
        return null
      } catch (err) {
        console.log("[v0] IP geolocation unavailable, using default location")
        return null
      }
    }

    const getBrowserLocation = (): Promise<UserLocation | null> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null)
          return
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          () => {
            // User denied or error occurred
            resolve(null)
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 0, // Don't cache browser location
          },
        )
      })
    }

    const detectLocation = async () => {
      // Try browser geolocation first
      const browserLocation = await getBrowserLocation()
      if (browserLocation && isMounted) {
        setLocation(browserLocation)
        setLoading(false)
        return
      }

      // Fall back to IP geolocation (with 24-hour cache)
      const ipLocation = await getIPLocation()
      if (ipLocation && isMounted) {
        setLocation(ipLocation)
        setLoading(false)
        return
      }

      // Fall back to default location (Geographic center of United States)
      if (isMounted) {
        setLocation(DEFAULT_LOCATION)
        setError("Could not detect location, using default")
        setLoading(false)
      }
    }

    detectLocation()

    return () => {
      isMounted = false
    }
  }, [])

  return { location, loading, error }
}
