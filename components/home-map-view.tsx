"use client"

import { useState, useMemo } from "react"
import { MapView } from "@/components/map-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal, X, ChevronUp, ChevronDown, List } from "lucide-react"
import { HAY_TYPES } from "@/lib/hay-types"
import { useUserLocation } from "@/hooks/use-user-location"
import type { LocationWithSupplier } from "@/lib/types"
import { MapLegend } from "@/components/map-legend"
import { OfferingIcon } from "@/components/offering-icon"
import { FilterPanel, EMPTY_FILTERS, type FilterOptions, type ServiceKey } from "@/components/filter-panel"
import { getOfferings, getOfferingColor, OFFERING_LABELS } from "@/lib/location-services"

interface HomeMapViewProps {
  locations: LocationWithSupplier[]
  isAuthenticated?: boolean
  userId?: string | null
  userSupplierId?: string | null
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")
}

export function HomeMapView({ locations, isAuthenticated = false, userId, userSupplierId }: HomeMapViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { location: userLocation } = useUserLocation()
  const [selectedLocation, setSelectedLocation] = useState<LocationWithSupplier | null>(null)
  // Mobile-only state
  const [mobileShowFilters, setMobileShowFilters] = useState(false)
  const [mobileShowListings, setMobileShowListings] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>(EMPTY_FILTERS)

  const availableCities = useMemo(
    () => [...new Set(locations.map((l) => l.city).filter(Boolean))].sort() as string[],
    [locations],
  )
  const availableStates = useMemo(
    () => [...new Set(locations.map((l) => l.state).filter(Boolean))].sort() as string[],
    [locations],
  )

  const filteredLocations = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return locations.filter((location) => {
      const supplier = location.supplier

      const matchesSearch =
        supplier.business_name.toLowerCase().includes(term) ||
        location.name.toLowerCase().includes(term) ||
        location.city?.toLowerCase().includes(term) ||
        location.state?.toLowerCase().includes(term) ||
        location.zip_code?.toLowerCase().includes(term) ||
        location.address?.toLowerCase().includes(term) ||
        supplier.description?.toLowerCase().includes(term) ||
        (location.inventory && location.inventory.some((item) => item.product_name.toLowerCase().includes(term)))

      const matchesType = filters.type === "all" || supplier.supplier_type === filters.type
      const matchesServices =
        filters.services.length === 0 ||
        filters.services.some((service) => (service === "squeeze" ? location.offers_squeeze : location.offers_transport))
      const matchesInventory = !filters.hasInventory || (location.inventory && location.inventory.length > 0)
      const matchesDelivery = !filters.deliveryAvailable || location.delivery_available

      const matchesZipCode = !filters.zipCode || location.zip_code?.includes(filters.zipCode)

      const matchesCities = filters.cities.length === 0 || (location.city && filters.cities.includes(location.city))
      const matchesStates = filters.states.length === 0 || (location.state && filters.states.includes(location.state))

      const matchesHayType =
        (filters.hayTypes.length === 0 && !filters.customHayType) ||
        (location.inventory &&
          location.inventory.some((item) => {
            const matchesSelectedTypes = filters.hayTypes.filter((t) => t !== "Other").includes(item.product_name)
            const matchesCustomType =
              filters.hayTypes.includes("Other") &&
              filters.customHayType &&
              item.product_name.toLowerCase().includes(filters.customHayType.toLowerCase())
            const matchesOtherCategory =
              filters.hayTypes.includes("Other") &&
              !filters.customHayType &&
              !HAY_TYPES.some((t) => t !== "Other" && t === item.product_name)

            return matchesSelectedTypes || matchesCustomType || matchesOtherCategory
          }))

      const minPrice = filters.minPrice ? Number.parseFloat(filters.minPrice) : 0
      const maxPrice = filters.maxPrice ? Number.parseFloat(filters.maxPrice) : Number.POSITIVE_INFINITY
      const matchesPriceRange =
        (!filters.minPrice && !filters.maxPrice) ||
        (location.inventory &&
          location.inventory.some((item) => {
            const price = Number.parseFloat(String(item.price_per_unit))
            return price >= minPrice && price <= maxPrice
          }))

      const matchesSellingUnit =
        filters.sellingUnits.length === 0 ||
        (location.inventory &&
          location.inventory.some((item) => {
            if (item.pricing_options && item.pricing_options.length > 0) {
              return item.pricing_options.some((option) => filters.sellingUnits.includes(option.unit))
            }
            return item.selling_unit && filters.sellingUnits.includes(item.selling_unit)
          }))

      return (
        matchesSearch &&
        matchesType &&
        matchesServices &&
        matchesInventory &&
        matchesDelivery &&
        matchesZipCode &&
        matchesCities &&
        matchesStates &&
        matchesHayType &&
        matchesPriceRange &&
        matchesSellingUnit
      )
    })
  }, [searchTerm, filters, locations])

  const toggleService = (service: ServiceKey) => {
    setFilters((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((v) => v !== service)
        : [...prev.services, service],
    }))
  }

  const setSupplierType = (type: FilterOptions["type"]) => setFilters((prev) => ({ ...prev, type }))

  const renderLegend = (compact = false) => (
    <MapLegend
      type={filters.type}
      services={filters.services}
      onTypeChange={setSupplierType}
      onToggleService={toggleService}
      compact={compact}
    />
  )

  const clearAllFilters = () => {
    setFilters(EMPTY_FILTERS)
    setSearchTerm("")
  }

  const activeFilterCount = [
    filters.type !== "all" ? 1 : 0,
    filters.services.length,
    filters.hasInventory ? 1 : 0,
    filters.deliveryAvailable ? 1 : 0,
    filters.hayTypes.length + (filters.customHayType ? 1 : 0),
    filters.zipCode ? 1 : 0,
    filters.minPrice || filters.maxPrice ? 1 : 0,
    filters.cities.length,
    filters.states.length,
    filters.sellingUnits.length,
  ].reduce((a, b) => a + b, 0)

  const locationCountLabel = `${filteredLocations.length} ${filteredLocations.length === 1 ? "Location" : "Locations"}`

  const renderFilterContent = () => (
    <FilterPanel
      filters={filters}
      setFilters={setFilters}
      availableStates={availableStates}
      availableCities={availableCities}
    />
  )

  const renderFilterHeader = () => (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-lg font-semibold text-foreground">Filters</h3>
      {activeFilterCount > 0 && (
        <p className="text-sm text-hay-medium">
          {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
        </p>
      )}
    </div>
  )

  const renderClearButton = () =>
    activeFilterCount > 0 ? (
      <div className="flex-shrink-0 border-t border-hay-border p-4">
        <Button onClick={clearAllFilters} variant="outline" className="w-full rounded-full border-hay-border bg-transparent">
          Clear all filters
        </Button>
      </div>
    ) : null

  const renderListingCards = () => (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {filteredLocations.length === 0 ? (
        <div className="py-12 text-center text-sm leading-relaxed text-hay-medium">
          No locations match your filters. Try adjusting your search criteria.
        </div>
      ) : (
        filteredLocations.map((location) => {
          const isSelected = selectedLocation?.id === location.id
          const offerings = getOfferings(location)
          const typeLabel = location.supplier.supplier_type === "broker" ? "Broker" : "Grower"
          return (
            <button
              key={location.id}
              type="button"
              onClick={() => {
                setSelectedLocation(location)
                setMobileShowListings(false)
              }}
              className={`flex w-full flex-col gap-3 rounded-2xl border bg-card p-4 text-left transition-all duration-200 hover:shadow-md ${
                isSelected ? "border-hay-dark shadow-md ring-1 ring-hay-dark" : "border-hay-border hover:border-hay-warm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hay-border bg-hay-bg-alt text-sm font-semibold text-hay-medium">
                  {location.supplier.logo_url ? (
                    <img
                      src={location.supplier.logo_url || "/placeholder.svg"}
                      alt={`${location.supplier.business_name} logo`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">{initials(location.supplier.business_name)}</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-base font-semibold text-foreground">
                      {location.supplier.business_name}
                    </span>
                    <span className="flex shrink-0 -space-x-1">
                      {offerings.map((offering) => (
                        <span key={offering} className="rounded-full ring-2 ring-card">
                          <OfferingIcon
                            offering={offering}
                            color={getOfferingColor(offering, location.supplier.supplier_type)}
                            label={offering === "hay" ? `${typeLabel} hay for sale` : OFFERING_LABELS[offering]}
                          />
                        </span>
                      ))}
                    </span>
                  </div>
                  <span className="text-sm text-hay-medium">
                    {typeLabel} · {location.name}
                  </span>
                </div>
              </div>
              <div className="text-sm leading-relaxed text-hay-warm-gray">
                <div>{location.address}</div>
                <div>
                  {location.city}, {location.state} {location.zip_code}
                </div>
              </div>
              {location.inventory.length > 0 && (
                <span className="text-xs font-semibold text-hay-dark">
                  {location.inventory.length} hay type{location.inventory.length !== 1 ? "s" : ""} available
                </span>
              )}
            </button>
          )
        })
      )}
    </div>
  )

  return (
    <div className="relative flex h-full w-full flex-col md:block">
      {/* ==================== MOBILE SEARCH BAR (< md) -- in document flow, above map ==================== */}
      <div className="flex shrink-0 gap-2 border-b border-hay-border bg-hay-bg p-3 md:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-hay-medium" aria-hidden="true" />
          <Input
            aria-label="Search suppliers"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 rounded-full border-hay-border bg-card pl-10 text-sm"
          />
        </div>
        <Button
          variant={mobileShowFilters ? "default" : "outline"}
          size="icon"
          aria-label="Filters"
          className="h-10 w-10 shrink-0 rounded-full border-hay-border"
          onClick={() => {
            setMobileShowFilters(!mobileShowFilters)
            setMobileShowListings(false)
          }}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* ===== SINGLE SHARED MAP (fills remaining space on mobile, offset on desktop) ===== */}
      <div className="relative flex flex-1 flex-col md:absolute md:inset-0 md:left-[770px]">
        <MapView
          locations={filteredLocations}
          isAuthenticated={isAuthenticated}
          userId={userId}
          userSupplierId={userSupplierId}
          userLocation={userLocation}
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
          activeFilters={filters}
        />
      </div>

      {/* Mobile floating listings toggle button - hide when location card is open */}
      {!selectedLocation && (
        <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 md:hidden">
          <Button
            onClick={() => {
              setMobileShowListings(!mobileShowListings)
              setMobileShowFilters(false)
            }}
            className="h-10 gap-2 rounded-full bg-hay-dark px-5 text-hay-bg shadow-lg hover:bg-hay-dark-hover"
          >
            <List className="h-4 w-4" />
            {locationCountLabel}
            {mobileShowListings ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
        </div>
      )}

      {/* Mobile filter overlay */}
      {mobileShowFilters && (
        <div className="absolute inset-0 z-20 flex flex-col bg-hay-bg md:hidden">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-hay-border p-4">
            {renderFilterHeader()}
            <Button variant="ghost" size="icon" aria-label="Close filters" onClick={() => setMobileShowFilters(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {renderFilterContent()}
          <div className="flex flex-shrink-0 gap-2 border-t border-hay-border p-4">
            {activeFilterCount > 0 && (
              <Button onClick={clearAllFilters} variant="outline" className="flex-1 rounded-full border-hay-border">
                Clear all
              </Button>
            )}
            <Button
              onClick={() => setMobileShowFilters(false)}
              className="flex-1 rounded-full bg-hay-dark text-hay-bg hover:bg-hay-dark-hover"
            >
              Show {filteredLocations.length} results
            </Button>
          </div>
        </div>
      )}

      {/* Mobile listings bottom sheet */}
      {mobileShowListings && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex max-h-[70vh] flex-col rounded-t-2xl bg-hay-bg shadow-2xl md:hidden">
          <div className="flex items-center justify-between border-b border-hay-border px-4 py-3">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-bold text-foreground">{locationCountLabel}</h2>
              {renderLegend(true)}
            </div>
            <Button variant="ghost" size="icon" aria-label="Close list" onClick={() => setMobileShowListings(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {renderListingCards()}
        </div>
      )}

      {/* ==================== DESKTOP PANELS (>= md) ==================== */}
      {/* Filter sidebar */}
      <aside
        aria-label="Filters"
        className="absolute bottom-0 left-0 top-0 z-10 hidden w-80 flex-col overflow-hidden border-r border-hay-border bg-hay-bg md:flex"
      >
        <div className="flex-shrink-0 border-b border-hay-border p-4">{renderFilterHeader()}</div>
        {renderFilterContent()}
        {renderClearButton()}
      </aside>

      {/* Listings panel */}
      <section
        aria-label="Locations"
        className="absolute bottom-0 left-80 top-0 z-10 hidden w-[450px] flex-col overflow-hidden border-r border-hay-border bg-hay-bg-alt md:flex"
      >
        <div className="flex flex-shrink-0 flex-col gap-3 border-b border-hay-border bg-hay-bg px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-foreground">{locationCountLabel}</h2>
            <span className="text-xs text-hay-medium">Tap a type to filter</span>
          </div>
          {renderLegend()}
        </div>
        {renderListingCards()}
      </section>

      {/* Desktop search floating on the map, clear of the Map/Satellite and fullscreen controls */}
      <div className="pointer-events-none absolute right-16 top-2.5 z-10 hidden left-[calc(770px+11rem)] md:flex md:justify-center">
        <div className="pointer-events-auto relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-hay-medium" aria-hidden="true" />
          <Input
            aria-label="Search suppliers, products, or locations"
            placeholder="Search suppliers, hay, or towns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 rounded-full border-hay-border bg-card pl-10 shadow-md"
          />
        </div>
      </div>
    </div>
  )
}
