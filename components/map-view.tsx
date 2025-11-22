"use client"

import { useState, useEffect } from "react"
import { SupplierCard } from "@/components/supplier-card"
import type { Supplier, Inventory } from "@/lib/types"

interface SupplierWithInventory extends Supplier {
  inventory: Inventory[]
}

interface MapViewProps {
  suppliers: SupplierWithInventory[]
}

export function MapView({ suppliers }: MapViewProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithInventory | null>(null)
  const [map, setMap] = useState<any | null>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!mapsApiKey || suppliers.length === 0) return

    const initMap = () => {
      if (!window.google?.maps?.Map || !window.google?.maps?.marker?.AdvancedMarkerElement) {
        console.log("[v0] Google Maps not fully loaded yet, retrying...")
        setTimeout(initMap, 100)
        return
      }

      console.log("[v0] Google Maps fully loaded, creating map...")
      setMapsLoaded(true)

      const mapInstance = new window.google.maps.Map(document.getElementById("map") as HTMLElement, {
        center: { lat: 32.2226, lng: -110.9747 }, // Tucson, Arizona
        zoom: 10,
        mapId: "CROPPER_MAP_ID", // Required for AdvancedMarkerElement
      })

      setMap(mapInstance)

      const newMarkers = suppliers
        .filter((supplier) => supplier.latitude && supplier.longitude)
        .map((supplier) => {
          const markerElement = document.createElement("div")
          markerElement.style.width = "24px"
          markerElement.style.height = "24px"
          markerElement.style.borderRadius = "50%"
          markerElement.style.backgroundColor = supplier.supplier_type === "broker" ? "#16a34a" : "#ca8a04"
          markerElement.style.border = "3px solid white"
          markerElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)"
          markerElement.style.cursor = "pointer"

          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            map: mapInstance,
            position: { lat: Number(supplier.latitude), lng: Number(supplier.longitude) },
            content: markerElement,
            title: supplier.business_name,
          })

          marker.addListener("click", () => {
            setSelectedSupplier(supplier)
          })

          return marker
        })

      setMarkers(newMarkers)
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=marker&callback=initGoogleMaps`
      script.async = true
      script.defer = true
      ;(window as any).initGoogleMaps = () => {
        console.log("[v0] Google Maps callback fired")
        initMap()
      }

      document.head.appendChild(script)
    } else {
      initMap()
    }

    return () => {
      markers.forEach((marker) => (marker.map = null))
    }
  }, [suppliers, mapsApiKey])

  if (!mapsApiKey) {
    return (
      <div className="flex h-full">
        <div className="w-[450px] border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h2 className="text-xl font-bold text-gray-900">
              {suppliers.length} {suppliers.length === 1 ? "Supplier" : "Suppliers"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Configure Google Maps API key to see map view</p>

            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span className="text-xs font-medium">Broker</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                <span className="text-xs font-medium">Grower</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {suppliers.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                No suppliers available yet. Sign up as a supplier to list your products!
              </div>
            ) : (
              suppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  onClick={() => setSelectedSupplier(supplier)}
                  className={`w-full p-4 border rounded-lg hover:shadow-md transition-all text-left ${
                    selectedSupplier?.id === supplier.id ? "border-green-600 bg-green-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-base text-gray-900">{supplier.business_name}</div>
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 mt-1 ${
                        supplier.supplier_type === "broker" ? "bg-green-600" : "bg-yellow-600"
                      }`}
                    />
                  </div>
                  <div className="text-sm text-gray-600 capitalize mb-2">
                    {supplier.supplier_type === "broker" ? "Broker • Grow + Deliver" : "Grower • Grow Only"}
                  </div>
                  {(supplier.city || supplier.state) && (
                    <div className="text-sm text-gray-600 mb-2">
                      {supplier.city}
                      {supplier.state && `, ${supplier.state}`}
                    </div>
                  )}
                  {supplier.description && (
                    <div className="text-sm text-gray-600 mt-2 line-clamp-2">{supplier.description}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 relative bg-gradient-to-br from-green-50 to-yellow-50">
          {selectedSupplier ? (
            <div className="p-6 overflow-y-auto h-full">
              <SupplierCard supplier={selectedSupplier} onClose={() => setSelectedSupplier(null)} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Map View Available</h3>
                <p className="text-gray-600">Add Google Maps API key to see interactive map</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="w-[450px] border-r bg-gradient-to-b from-white to-gray-50/50 overflow-y-auto shadow-lg">
        <div className="p-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {suppliers.length} {suppliers.length === 1 ? "Supplier" : "Suppliers"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Configure Google Maps API key to see map view</p>

          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
              <div className="w-2.5 h-2.5 rounded-full bg-green-600 shadow-sm"></div>
              <span className="text-xs font-semibold text-green-900">Broker</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-100">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-600 shadow-sm"></div>
              <span className="text-xs font-semibold text-yellow-900">Grower</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {suppliers.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No suppliers available yet. Sign up as a supplier to list your products!
            </div>
          ) : (
            suppliers.map((supplier) => (
              <button
                key={supplier.id}
                onClick={() => setSelectedSupplier(supplier)}
                className={`w-full p-4 border rounded-xl hover:shadow-lg transition-all duration-200 text-left ${
                  selectedSupplier?.id === supplier.id
                    ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-base text-gray-900">{supplier.business_name}</div>
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 mt-1 shadow-sm ${
                      supplier.supplier_type === "broker" ? "bg-green-600" : "bg-yellow-600"
                    }`}
                  />
                </div>
                <div className="text-sm text-gray-600 capitalize mb-2">
                  {supplier.supplier_type === "broker" ? "Broker • Grow + Deliver" : "Grower • Grow Only"}
                </div>
                {(supplier.city || supplier.state) && (
                  <div className="text-sm text-gray-600 mb-2">
                    {supplier.city}
                    {supplier.state && `, ${supplier.state}`}
                  </div>
                )}
                {supplier.description && (
                  <div className="text-sm text-gray-600 mt-2 line-clamp-2">{supplier.description}</div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <div id="map" className="w-full h-full" />

        {selectedSupplier && (
          <div className="absolute top-4 right-4 w-96 max-h-[calc(100vh-120px)] overflow-y-auto z-10">
            <SupplierCard supplier={selectedSupplier} onClose={() => setSelectedSupplier(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
