"use client"

import { useState, useEffect, useRef } from "react"
import { SupplierCard } from "@/components/supplier-card"
import type { Supplier, Inventory } from "@/lib/types"

interface SupplierWithInventory extends Supplier {
  inventory: Inventory[]
}

interface MapViewProps {
  suppliers: SupplierWithInventory[]
  isAuthenticated?: boolean
  userLocation?: { lat: number; lng: number } | null
  selectedSupplier?: SupplierWithInventory | null
  onSupplierSelect?: (supplier: SupplierWithInventory | null) => void
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 } // Geographic center of United States

export function MapView({
  suppliers,
  isAuthenticated = false,
  userLocation,
  selectedSupplier,
  onSupplierSelect,
}: MapViewProps) {
  const [map, setMap] = useState<any | null>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [mapsError, setMapsError] = useState<string | null>(null)
  const [useAdvancedMarkers, setUseAdvancedMarkers] = useState(true)
  const isListSelection = useRef(false)
  const initialLocationSet = useRef(false)
  const prevUserLocation = useRef<{ lat: number; lng: number } | null>(null)
  const prevSuppliersCount = useRef<number>(suppliers.length)
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "CROPPER_MAP_ID"

  useEffect(() => {
    if (!map || !mapsLoaded || !userLocation) return

    const isNewLocation =
      !prevUserLocation.current ||
      prevUserLocation.current.lat !== userLocation.lat ||
      prevUserLocation.current.lng !== userLocation.lng

    if (isNewLocation) {
      console.log("[v0] User location detected, panning to:", userLocation)

      map.panTo(userLocation)
      map.setZoom(10)

      prevUserLocation.current = userLocation
    }
  }, [map, mapsLoaded, userLocation])

  useEffect(() => {
    if (!map || !mapsLoaded || suppliers.length === 0) return

    const suppliersWithLocation = suppliers.filter((s) => s.latitude && s.longitude)
    if (suppliersWithLocation.length === 0) {
      map.panTo(userLocation)
      map.setZoom(10)
      initialLocationSet.current = true
    }
  }, [map, mapsLoaded, userLocation, suppliers])

  useEffect(() => {
    if (!map || !mapsLoaded || suppliers.length === 0) return

    const suppliersChanged = prevSuppliersCount.current !== suppliers.length
    prevSuppliersCount.current = suppliers.length

    const delay = suppliersChanged ? 0 : 100

    const timeoutId = setTimeout(() => {
      const suppliersWithLocation = suppliers.filter((supplier) => {
        const hasLatLng = !!(supplier.latitude && supplier.longitude)
        return hasLatLng
      })

      if (suppliersWithLocation.length === 0) return

      console.log("[v0] Auto-zooming map to fit", suppliersWithLocation.length, "suppliers")

      const bounds = new window.google.maps.LatLngBounds()
      suppliersWithLocation.forEach((supplier) => {
        bounds.extend({ lat: Number(supplier.latitude), lng: Number(supplier.longitude) })
      })

      map.fitBounds(bounds)

      const padding = { top: 50, right: 50, bottom: 50, left: 350 }
      map.fitBounds(bounds, padding)

      window.google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        const currentZoom = map.getZoom()
        const markerCount = suppliersWithLocation.length

        if (markerCount === 1) {
          if (currentZoom > 12) map.setZoom(12)
          else if (currentZoom < 10) map.setZoom(10)
        } else {
          if (currentZoom < 8) {
            map.setZoom(8)
          } else if (currentZoom > 11) {
            map.setZoom(11)
          }
        }
      })
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [suppliers, map, mapsLoaded])

  useEffect(() => {
    if (!mapsApiKey || suppliers.length === 0) return

    const initMap = async () => {
      if (!window.google?.maps?.Map) {
        setTimeout(initMap, 100)
        return
      }

      try {
        setMapsLoaded(true)
        setMapsError(null)

        const initialCenter = userLocation || DEFAULT_CENTER

        let mapInstance
        let AdvancedMarkerElement

        if (mapId && useAdvancedMarkers) {
          try {
            const markerLibrary = (await window.google.maps.importLibrary("marker")) as any
            AdvancedMarkerElement = markerLibrary.AdvancedMarkerElement

            mapInstance = new window.google.maps.Map(document.getElementById("map") as HTMLElement, {
              center: initialCenter,
              zoom: 10,
              mapId: mapId,
            })
          } catch (error: any) {
            console.warn("[v0] Failed to initialize advanced markers, falling back to standard markers:", error)
            setUseAdvancedMarkers(false)
            // Fall through to standard map initialization
          }
        }

        if (!mapInstance) {
          mapInstance = new window.google.maps.Map(document.getElementById("map") as HTMLElement, {
            center: initialCenter,
            zoom: 10,
          })
        }

        setMap(mapInstance)

        const suppliersWithLocation = suppliers.filter((supplier) => {
          const hasAddress = !!(supplier.address && supplier.city && supplier.state)
          const hasLatLng = !!(supplier.latitude && supplier.longitude)
          const hasInventory = supplier.inventory && supplier.inventory.length > 0
          return hasAddress && hasInventory && hasLatLng
        })

        const newMarkers = suppliersWithLocation.map((supplier) => {
          const position = { lat: Number(supplier.latitude), lng: Number(supplier.longitude) }

          let marker

          if (AdvancedMarkerElement && useAdvancedMarkers) {
            const markerDiv = document.createElement("div")
            markerDiv.style.width = "20px"
            markerDiv.style.height = "20px"
            markerDiv.style.borderRadius = "50%"
            markerDiv.style.backgroundColor = supplier.supplier_type === "broker" ? "#16a34a" : "#ca8a04"
            markerDiv.style.border = "3px solid white"
            markerDiv.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)"
            markerDiv.style.cursor = "pointer"

            marker = new AdvancedMarkerElement({
              map: mapInstance,
              position,
              content: markerDiv,
              title: supplier.business_name,
            })
          } else {
            marker = new window.google.maps.Marker({
              map: mapInstance,
              position,
              title: supplier.business_name,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: supplier.supplier_type === "broker" ? "#16a34a" : "#ca8a04",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
                scale: 10,
              },
            })
          }

          marker.addListener("click", () => {
            onSupplierSelect?.(supplier)
            mapInstance.panTo(position)
            mapInstance.setZoom(13)
          })

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
      const libraries = mapId && useAdvancedMarkers ? "marker" : ""
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}${libraries ? `&libraries=${libraries}` : ""}&loading=async`
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
  }, [suppliers, mapsApiKey, mapId, userLocation, useAdvancedMarkers, onSupplierSelect])

  useEffect(() => {
    if (!map || !mapsLoaded || !selectedSupplier || !isListSelection.current) return

    const lat = Number(selectedSupplier.latitude)
    const lng = Number(selectedSupplier.longitude)

    if (lat && lng) {
      map.panTo({ lat, lng })
      map.setZoom(13)
    }

    isListSelection.current = false
  }, [selectedSupplier, map, mapsLoaded])

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

      {selectedSupplier && (
        <div className="absolute top-4 right-4 w-[420px] max-h-[calc(100vh-120px)] overflow-y-auto z-10">
          <SupplierCard
            supplier={selectedSupplier}
            onClose={() => onSupplierSelect?.(null)}
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}
    </div>
  )
}
