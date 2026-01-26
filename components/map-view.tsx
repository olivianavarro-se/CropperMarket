"use client"

import { useState, useEffect, useRef } from "react"
import { LocationCard } from "@/components/location-card"
import type { LocationWithSupplier } from "@/lib/types"

interface MapViewProps {
  locations: LocationWithSupplier[]
  isAuthenticated?: boolean
  userId?: string | null
  userLocation?: { lat: number; lng: number } | null
  selectedLocation?: LocationWithSupplier | null
  onLocationSelect?: (location: LocationWithSupplier | null) => void
  activeFilters?: any // Added activeFilters prop to pass to cards and for auto-zoom
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 } // Geographic center of United States

export function MapView({
  locations,
  isAuthenticated = false,
  userId,
  userLocation,
  selectedLocation,
  onLocationSelect,
  activeFilters,
}: MapViewProps) {
  const [map, setMap] = useState<any | null>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [mapsError, setMapsError] = useState<string | null>(null)
  const [useAdvancedMarkers, setUseAdvancedMarkers] = useState(false)
  const hasUserInteracted = useRef(false)
  const prevUserLocation = useRef<{ lat: number; lng: number } | null>(null)
  const initialMapSet = useRef(false)
  const prevFiltersActive = useRef(false)
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined

  useEffect(() => {
    if (!map || !mapsLoaded || !userLocation || hasUserInteracted.current) return

    // Don't pan to the default US center location - that's handled by the map's initial state
    const isDefaultLocation = 
      userLocation.lat === DEFAULT_CENTER.lat && 
      userLocation.lng === DEFAULT_CENTER.lng

    if (isDefaultLocation) {
      return
    }

    const isNewLocation =
      !prevUserLocation.current ||
      prevUserLocation.current.lat !== userLocation.lat ||
      prevUserLocation.current.lng !== userLocation.lng

    if (isNewLocation) {
      map.panTo(userLocation)
      map.setZoom(10)
      prevUserLocation.current = userLocation
      console.log("[Location] Map panned to user location:", userLocation)
    }
  }, [map, mapsLoaded, userLocation])

  useEffect(() => {
    if (!mapsApiKey || locations.length === 0) return

    const initMap = async () => {
      if (!window.google?.maps?.Map) {
        setTimeout(initMap, 100)
        return
      }

      try {
        setMapsLoaded(true)
        setMapsError(null)

        const isValidLocation = (loc: { lat: number; lng: number } | null | undefined): boolean => {
          if (!loc) return false
          return loc.lat !== 0 && loc.lng !== 0 && !isNaN(loc.lat) && !isNaN(loc.lng)
        }

        const initialCenter = DEFAULT_CENTER
        const initialZoom = 5 // Integer zoom levels render crisp map tiles

        const mapOptions: any = {
          center: initialCenter,
          zoom: initialZoom,
        }

        if (mapId) {
          mapOptions.mapId = mapId
        }

        const mapInstance = new window.google.maps.Map(document.getElementById("map") as HTMLElement, mapOptions)

        setMap(mapInstance)

        const locationsWithCoords = locations.filter((location) => {
          const hasLatLng = !!(location.latitude && location.longitude)
          const hasInventory = location.inventory && location.inventory.length > 0
          return hasLatLng && hasInventory
        })

        const AdvancedMarkerElement = mapId ? (window.google.maps as any).marker?.AdvancedMarkerElement : null
        const hasAdvancedMarkers = !!AdvancedMarkerElement

        if (hasAdvancedMarkers) {
          setUseAdvancedMarkers(true)
        } else {
          setUseAdvancedMarkers(false)
        }

        const newMarkers = locationsWithCoords.map((location) => {
          const position = { lat: Number(location.latitude), lng: Number(location.longitude) }

          let marker: any

          if (hasAdvancedMarkers) {
            const pinElement = document.createElement("div")
            pinElement.style.width = "20px"
            pinElement.style.height = "20px"
            pinElement.style.borderRadius = "50%"
            pinElement.style.backgroundColor = location.supplier.supplier_type === "broker" ? "#16a34a" : "#ca8a04"
            pinElement.style.border = "3px solid #ffffff"
            pinElement.style.cursor = "pointer"

            marker = new AdvancedMarkerElement({
              map: mapInstance,
              position,
              title: `${location.supplier.business_name} - ${location.name}`,
              content: pinElement,
            })

            pinElement.addEventListener("click", () => {
              hasUserInteracted.current = true
              onLocationSelect?.(location)
              mapInstance.panTo(position)
              mapInstance.setZoom(13)
            })
          } else {
            marker = new window.google.maps.Marker({
              map: mapInstance,
              position,
              title: `${location.supplier.business_name} - ${location.name}`,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: location.supplier.supplier_type === "broker" ? "#16a34a" : "#ca8a04",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
                scale: 10,
              },
            })

            marker.addListener("click", () => {
              hasUserInteracted.current = true
              onLocationSelect?.(location)
              mapInstance.panTo(position)
              mapInstance.setZoom(13)
            })
          }

          return marker
        })

        setMarkers(newMarkers)
      } catch (error) {
        console.error("Maps initialization error:", error)
        setMapsError("Failed to initialize map")
        setMapsLoaded(false)
      }
    }

    if (!window.google?.maps) {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        existingScript.addEventListener("load", initMap)
        return () => {
          existingScript.removeEventListener("load", initMap)
        }
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=marker&loading=async`
      script.async = true
      script.defer = true
      script.onload = initMap
      script.onerror = () => {
        setMapsError("Failed to load Google Maps")
      }

      document.head.appendChild(script)
    } else {
      initMap()
    }

    return () => {
      markers.forEach((marker) => {
        if (marker.map) marker.map = null
      })
    }
  }, [locations, mapsApiKey, mapId, userLocation, onLocationSelect])

  useEffect(() => {
    if (!map || !mapsLoaded || !selectedLocation) return

    const lat = Number(selectedLocation.latitude)
    const lng = Number(selectedLocation.longitude)

    if (lat && lng) {
      hasUserInteracted.current = true
      map.panTo({ lat, lng })
      map.setZoom(13)
    }
  }, [selectedLocation, map, mapsLoaded])

  useEffect(() => {
    if (!map || !mapsLoaded || locations.length === 0) return

    // Check if any filters are active
    const hasActiveFilters =
      activeFilters &&
      (activeFilters.type !== "all" ||
        activeFilters.hasInventory ||
        activeFilters.deliveryAvailable ||
        activeFilters.hayTypes.length > 0 ||
        activeFilters.customHayType ||
        activeFilters.zipCode ||
        activeFilters.minPrice ||
        activeFilters.maxPrice ||
        activeFilters.cities.length > 0 ||
        activeFilters.states.length > 0 ||
        activeFilters.sellingUnits.length > 0)

    // Check if filters were just cleared (went from active to inactive)
    const filtersJustCleared = prevFiltersActive.current && !hasActiveFilters
    
    if (filtersJustCleared) {
      hasUserInteracted.current = false // Reset interaction flag
      
      // Pan back to user location if available
      if (userLocation) {
        map.panTo(userLocation)
        map.setZoom(10)
      } else {
        // Return to default US view
        map.panTo(DEFAULT_CENTER)
        map.setZoom(5)
      }
    } else if (hasActiveFilters && locations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      let hasValidBounds = false

      locations.forEach((location) => {
        const lat = Number(location.latitude)
        const lng = Number(location.longitude)
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          bounds.extend({ lat, lng })
          hasValidBounds = true
        }
      })

      if (hasValidBounds) {
        hasUserInteracted.current = true // Mark as interacted to prevent user location from overriding
        map.fitBounds(bounds)

        // Add padding and limit max zoom
        const listener = window.google.maps.event.addListenerOnce(map, "bounds_changed", () => {
          const currentZoom = map.getZoom()
          if (currentZoom && currentZoom > 12) {
            map.setZoom(12) // Limit max zoom to prevent over-zooming
          }
        })
      }
    }
    
    // Update previous filter state for next comparison
    prevFiltersActive.current = hasActiveFilters
  }, [map, mapsLoaded, locations, activeFilters])

  if (!mapsApiKey || mapsError) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Map Configuration Needed</h3>
          <p className="text-gray-600 mb-4">Google Maps API is not available</p>
          {mapsError && (
            <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left max-w-md mx-auto">
              <p className="text-sm text-yellow-900 font-semibold mb-2">⚠️ Configuration Required</p>
              <ol className="text-xs text-yellow-800 space-y-2 list-decimal list-inside">
                <li>
                  Verify billing:{" "}
                  <a
                    href="https://console.cloud.google.com/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Check billing
                  </a>
                </li>
                <li>
                  Enable API:{" "}
                  <a
                    href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Enable
                  </a>
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div id="map" className="w-full h-full" />

      {selectedLocation && (
        <div className="absolute top-4 right-4 w-[420px] max-h-[calc(100vh-120px)] overflow-y-auto z-10">
          <LocationCard
            location={selectedLocation}
            onClose={() => onLocationSelect?.(null)}
            isAuthenticated={isAuthenticated}
            userId={userId}
            activeFilters={activeFilters}
          />
        </div>
      )}
    </div>
  )
}
