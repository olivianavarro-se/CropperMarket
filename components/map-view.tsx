"use client"

import { useState, useEffect, useRef } from "react"
import { MarkerClusterer, SuperClusterAlgorithm, type Renderer } from "@googlemaps/markerclusterer"
import { LocationCard } from "@/components/location-card"
import type { LocationWithSupplier } from "@/lib/types"
import { getPinColors, getPinItems, type Offering } from "@/lib/location-services"

interface MapViewProps {
  locations: LocationWithSupplier[]
  isAuthenticated?: boolean
  userId?: string | null
  userSupplierId?: string | null
  userLocation?: { lat: number; lng: number } | null
  selectedLocation?: LocationWithSupplier | null
  onLocationSelect?: (location: LocationWithSupplier | null) => void
  activeFilters?: any // Added activeFilters prop to pass to cards and for auto-zoom
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 } // Geographic center of United States

// Lucide icon paths (wheat, package, truck), inlined because map pins are plain DOM, not React.
const OFFERING_ICON_PATHS: Record<Offering, string> = {
  hay: '<path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/>',
  squeeze:
    '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>',
  transport:
    '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
}

// Google Maps sets its own font (Roboto) on the map, so pins copy the page font explicitly.
function appFontFamily() {
  return getComputedStyle(document.body).fontFamily || "system-ui, sans-serif"
}

function buildPinElement(items: { offering: Offering; color: string }[], name: string) {
  const wrapper = document.createElement("div")
  wrapper.style.cursor = "pointer"
  wrapper.style.display = "flex"
  wrapper.style.flexDirection = "column"
  wrapper.style.alignItems = "center"
  wrapper.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"

  wrapper.style.transition = "transform 150ms ease"
  wrapper.style.transformOrigin = "bottom center"

  const pill = document.createElement("div")
  pill.setAttribute("data-pin-pill", "")
  pill.style.border = "2px solid #ffffff"
  pill.style.transition = "border-color 150ms ease"
  pill.style.display = "flex"
  pill.style.alignItems = "center"
  pill.style.gap = "2px"
  pill.style.padding = "3px"
  pill.style.background = "#ffffff"
  pill.style.borderRadius = "999px"

  items.forEach(({ offering, color }) => {
    const chip = document.createElement("span")
    chip.style.width = "22px"
    chip.style.height = "22px"
    chip.style.borderRadius = "999px"
    chip.style.background = color
    chip.style.display = "flex"
    chip.style.alignItems = "center"
    chip.style.justifyContent = "center"
    chip.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${OFFERING_ICON_PATHS[offering]}</svg>`
    pill.appendChild(chip)
  })

  // Shown only at close zoom via the .show-pin-labels class on the map container (see globals.css).
  const label = document.createElement("span")
  label.setAttribute("data-pin-label", "")
  label.textContent = name
  label.style.padding = "0 8px 0 5px"
  label.style.font = `600 12px ${appFontFamily()}`
  label.style.color = "#1f2a22"
  label.style.whiteSpace = "nowrap"
  label.style.maxWidth = "160px"
  label.style.overflow = "hidden"
  label.style.textOverflow = "ellipsis"
  pill.appendChild(label)

  // Small pointer under the pill so its tip sits on the exact map position.
  const tail = document.createElement("div")
  tail.style.width = "0"
  tail.style.height = "0"
  tail.style.marginTop = "-1px"
  tail.style.borderLeft = "5px solid transparent"
  tail.style.borderRight = "5px solid transparent"
  tail.style.borderTop = "6px solid #ffffff"

  wrapper.appendChild(pill)
  wrapper.appendChild(tail)
  return wrapper
}

const CLUSTER_INK = "#1f2a22"
// Beyond this zoom, pins are always shown individually.
const CLUSTER_MAX_ZOOM = 13
// Past the clustering level, so a selected farm always shows as its own pin with its name.
const SELECTED_ZOOM = CLUSTER_MAX_ZOOM + 2

// The details panel covers part of the map (bottom 60% on mobile, right side on desktop),
// so shift the view to keep the pin in the visible area.
function focusOnLocation(map: any, position: { lat: number; lng: number }) {
  map.setZoom(SELECTED_ZOOM)
  map.setCenter(position)
  if (window.innerWidth < 768) {
    const mapHeight = (map.getDiv() as HTMLElement).clientHeight
    map.panBy(0, mapHeight * 0.3)
    return
  }
  const panelWidth = window.innerWidth >= 1024 ? 420 : 380
  map.panBy((panelWidth + 16) / 2, 0)
}

function clusterSize(count: number) {
  if (count >= 50) return 52
  if (count >= 10) return 44
  return 36
}

function buildClusterElement(count: number) {
  const size = clusterSize(count)
  const el = document.createElement("div")
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.borderRadius = "999px"
  el.style.background = CLUSTER_INK
  el.style.color = "#ffffff"
  el.style.border = "3px solid #ffffff"
  el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)"
  el.style.display = "flex"
  el.style.alignItems = "center"
  el.style.justifyContent = "center"
  el.style.font = `600 ${count >= 100 ? 12 : 13}px ${appFontFamily()}`
  el.style.cursor = "pointer"
  el.style.transition = "transform 120ms ease"
  el.addEventListener("mouseenter", () => (el.style.transform = "scale(1.08)"))
  el.addEventListener("mouseleave", () => (el.style.transform = "scale(1)"))
  el.textContent = String(count)
  return el
}

function createClusterRenderer(useAdvanced: boolean): Renderer {
  return {
    render: ({ count, position }) => {
      const title = `${count} locations, click to zoom in`
      const zIndex = 1000 + count
      if (useAdvanced) {
        const AdvancedMarkerElement = (window.google.maps as any).marker.AdvancedMarkerElement
        return new AdvancedMarkerElement({ position, title, zIndex, content: buildClusterElement(count) })
      }
      return new window.google.maps.Marker({
        position,
        title,
        zIndex,
        label: { text: String(count), color: "#ffffff", fontSize: "13px", fontWeight: "600" },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: CLUSTER_INK,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
          scale: clusterSize(count) / 2,
        },
      })
    },
  }
}

// Selected farm: dark outline, slightly larger, name always visible, drawn above nearby pins.
function setPinSelected(marker: any, selected: boolean) {
  const baseZ = marker.__baseZIndex ?? 1
  const wrapper = marker.__pinElement as HTMLElement | undefined
  if (wrapper) {
    wrapper.style.transform = selected ? "scale(1.15)" : "scale(1)"
    wrapper.toggleAttribute("data-pin-selected", selected)
    const pill = wrapper.querySelector<HTMLElement>("[data-pin-pill]")
    const tail = wrapper.lastElementChild as HTMLElement | null
    if (pill) pill.style.borderColor = selected ? CLUSTER_INK : "#ffffff"
    if (tail) tail.style.borderTopColor = selected ? CLUSTER_INK : "#ffffff"
    marker.zIndex = selected ? 5000 : baseZ
  } else if (typeof marker.setZIndex === "function") {
    marker.setZIndex(selected ? 5000 : baseZ)
  }
}

function removeMarker(marker: any) {
  if (typeof marker.setMap === "function") marker.setMap(null)
  else marker.map = null
}

export function MapView({
  locations,
  isAuthenticated = false,
  userId,
  userSupplierId,
  userLocation,
  selectedLocation,
  onLocationSelect,
  activeFilters,
}: MapViewProps) {
  const [map, setMap] = useState<any | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [mapsError, setMapsError] = useState<string | null>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const onLocationSelectRef = useRef(onLocationSelect)
  const selectedIdRef = useRef<string | null>(selectedLocation?.id ?? null)
  const hasUserInteracted = useRef(false)
  const prevUserLocation = useRef<{ lat: number; lng: number } | null>(null)
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
      try {
        map.panTo(userLocation)
        map.setZoom(10)
      } catch (error) {
        console.error("Map pan error:", error)
      }
      prevUserLocation.current = userLocation
      console.log("[Location] Map panned to user location:", userLocation)
    }
  }, [map, mapsLoaded, userLocation])

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect
  }, [onLocationSelect])

  useEffect(() => {
    if (!map || !mapsLoaded) return
    const container = map.getDiv() as HTMLElement
    const sync = () => container.classList.toggle("show-pin-labels", (map.getZoom() ?? 0) > CLUSTER_MAX_ZOOM)
    sync()
    const listener = map.addListener("zoom_changed", sync)
    return () => listener.remove()
  }, [map, mapsLoaded])

  useEffect(() => {
    if (!map || !mapsLoaded) return

    const visibleIds = new Set<string>()
    const useAdvanced = !!(mapId && (window.google.maps as any).marker?.AdvancedMarkerElement)

    // Google Maps can throw (e.g. when the key rejects the site's address); keep the rest of the page alive.
    try {
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map,
        algorithm: new SuperClusterAlgorithm({ radius: 70, maxZoom: CLUSTER_MAX_ZOOM }),
        renderer: createClusterRenderer(useAdvanced),
        onClusterClick: (_event, cluster, clusterMap) => {
          hasUserInteracted.current = true
          const bounds = cluster.bounds
          if (!bounds) return
          const ne = bounds.getNorthEast()
          const sw = bounds.getSouthWest()
          const isTight = Math.abs(ne.lat() - sw.lat()) < 0.005 && Math.abs(ne.lng() - sw.lng()) < 0.005
          if (isTight) {
            // Locations at (nearly) the same address never split apart, so jump straight to individual pins.
            clusterMap.setCenter(bounds.getCenter())
            clusterMap.setZoom(CLUSTER_MAX_ZOOM + 2)
          } else {
            clusterMap.fitBounds(bounds, 80)
          }
        },
      })
    }
    const clusterer = clustererRef.current

    locations.forEach((location) => {
      const hasLatLng = !!(location.latitude && location.longitude)
      const colors = getPinColors(location)
      if (!hasLatLng || colors.length === 0) return

      // Including the colors in the key rebuilds the pin when a location's services change.
      const id = `${location.id}:${colors.join(",")}`
      visibleIds.add(id)
      if (markersRef.current.has(id)) return

      const position = { lat: Number(location.latitude), lng: Number(location.longitude) }
      const isMulti = colors.length > 1
      const title = `${location.supplier.business_name} - ${location.name}${
        isMulti ? ` (${colors.length} offerings)` : ""
      }`
      const handleClick = () => {
        hasUserInteracted.current = true
        onLocationSelectRef.current?.(location)
        focusOnLocation(map, position)
      }

      let marker: any

      if (useAdvanced) {
        const AdvancedMarkerElement = (window.google.maps as any).marker.AdvancedMarkerElement
        const pinElement = buildPinElement(getPinItems(location), location.supplier.business_name)
        marker = new AdvancedMarkerElement({ position, title, content: pinElement, zIndex: isMulti ? 2 : 1 })
        marker.__pinElement = pinElement
        pinElement.addEventListener("click", handleClick)
      } else {
        marker = new window.google.maps.Marker({
          position,
          title,
          zIndex: isMulti ? 2 : 1,
          label: isMulti
            ? { text: String(colors.length), color: "#ffffff", fontSize: "11px", fontWeight: "700" }
            : undefined,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: colors[0],
            fillOpacity: 1,
            strokeColor: isMulti ? colors[1] : "#ffffff",
            strokeWeight: 3,
            scale: isMulti ? 13 : 10,
          },
        })
        marker.addListener("click", handleClick)
      }

      marker.__baseZIndex = isMulti ? 2 : 1
      marker.__locationId = location.id
      if (location.id === selectedIdRef.current) setPinSelected(marker, true)
      markersRef.current.set(id, marker)
      clusterer.addMarker(marker, true)
    })

    markersRef.current.forEach((marker, id) => {
      if (visibleIds.has(id)) return
      clusterer.removeMarker(marker, true)
      removeMarker(marker)
      markersRef.current.delete(id)
    })

    clusterer.render()
    } catch (error) {
      console.error("Map markers error:", error)
    }
  }, [map, mapsLoaded, locations, mapId])

  useEffect(() => {
    const markers = markersRef.current
    return () => {
      try {
        clustererRef.current?.clearMarkers()
        ;(clustererRef.current as any)?.setMap?.(null)
      } catch {}
      clustererRef.current = null
      markers.forEach((marker) => {
        try {
          removeMarker(marker)
        } catch {}
      })
      markers.clear()
    }
  }, [])

  useEffect(() => {
    if (!mapsApiKey) return

    // Google calls this global when the API key rejects the current site address.
    ;(window as any).gm_authFailure = () => {
      setMapsError("Google Maps rejected this site address")
    }

    let isComponentMounted = true
    let retryCount = 0
    const maxRetries = 50 // 5 seconds max wait

    const waitForGoogleMaps = (): Promise<boolean> => {
      return new Promise((resolve) => {
        const check = () => {
          if (!isComponentMounted) {
            resolve(false)
            return
          }
          if (window.google?.maps?.Map) {
            resolve(true)
            return
          }
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(check, 100)
          } else {
            resolve(false)
          }
        }
        check()
      })
    }

    const initMap = async () => {
      if (!isComponentMounted) return

      const mapsReady = await waitForGoogleMaps()
      if (!mapsReady || !isComponentMounted) {
        if (isComponentMounted) {
          setMapsError("Google Maps failed to load")
        }
        return
      }

      try {
        const mapElement = document.getElementById("map")
        if (!mapElement || !isComponentMounted) return

        setMapsError(null)

        const initialCenter = DEFAULT_CENTER
        const initialZoom = 5 // Integer zoom levels render crisp map tiles

        const mapOptions: any = {
          center: initialCenter,
          zoom: initialZoom,
        }

        if (mapId) {
          mapOptions.mapId = mapId
        }

        const mapInstance = new window.google.maps.Map(mapElement, mapOptions)
        
        // Wait for the map to be fully initialized
        await new Promise<void>((resolve) => {
          window.google.maps.event.addListenerOnce(mapInstance, "idle", () => {
            resolve()
          })
          // Fallback timeout in case idle never fires
          setTimeout(resolve, 2000)
        })

        if (!isComponentMounted) return
        
        setMapsLoaded(true)
        setMap(mapInstance)
      } catch (error) {
        if (isComponentMounted) {
          console.error("Maps initialization error:", error)
          setMapsError("Failed to initialize map")
          setMapsLoaded(false)
        }
      }
    }

    if (!window.google?.maps) {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]') as HTMLScriptElement | null
      const expectedSrc = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=marker&loading=async`
      const hasCorrectKey = existingScript?.src.includes(`key=${mapsApiKey}`)

      if (existingScript && hasCorrectKey) {
        // Script exists with correct key, wait for it to load
        if ((window as any).google?.maps) {
          initMap()
        } else {
          const handleLoad = () => initMap()
          existingScript.addEventListener("load", handleLoad)
          return () => {
            isComponentMounted = false
            existingScript.removeEventListener("load", handleLoad)
          }
        }
      } else {
        // Remove old script if it has wrong/missing key
        if (existingScript) {
          existingScript.remove()
          delete (window as any).google
        }

        const script = document.createElement("script")
        script.src = expectedSrc
        script.async = true
        script.defer = true
        script.onload = () => {
          if (isComponentMounted) initMap()
        }
        script.onerror = () => {
          if (isComponentMounted) setMapsError("Failed to load Google Maps")
        }

        document.head.appendChild(script)
      }
    } else {
      initMap()
    }

    return () => {
      isComponentMounted = false
    }
  }, [mapsApiKey, mapId])

  useEffect(() => {
    const selectedId = selectedLocation?.id ?? null
    selectedIdRef.current = selectedId
    markersRef.current.forEach((marker) => setPinSelected(marker, marker.__locationId === selectedId))
  }, [selectedLocation, locations])

  useEffect(() => {
    if (!map || !mapsLoaded || !selectedLocation) return

    const lat = Number(selectedLocation.latitude)
    const lng = Number(selectedLocation.longitude)

    if (lat && lng) {
      hasUserInteracted.current = true
      try {
        focusOnLocation(map, { lat, lng })
      } catch (error) {
        console.error("Map pan error:", error)
      }
    }
  }, [selectedLocation, map, mapsLoaded])

  useEffect(() => {
    if (!map || !mapsLoaded || locations.length === 0) return

    // Check if any filters are active
    const hasActiveFilters =
      activeFilters &&
      (activeFilters.type !== "all" ||
        activeFilters.services?.length > 0 ||
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

    try {
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
    } catch (error) {
      console.error("Map zoom error:", error)
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
          <p className="text-gray-600 mb-4">{mapsError ?? "Google Maps API is not available"}</p>
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
        <div className="absolute inset-x-3 top-[40%] bottom-16 sm:inset-x-4 md:inset-x-auto md:top-4 md:bottom-4 md:right-4 md:w-[380px] lg:w-[420px] overflow-y-auto z-10 rounded-xl">
        <LocationCard
          location={selectedLocation}
          onClose={() => onLocationSelect?.(null)}
          isAuthenticated={isAuthenticated}
          userId={userId}
          userSupplierId={userSupplierId}
          activeFilters={activeFilters}
        />
        </div>
      )}
    </div>
  )
}
