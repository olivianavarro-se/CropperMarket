"use client"

import { useState, useMemo } from "react"
import { MapView } from "@/components/map-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, SlidersHorizontal, X, ChevronUp, ChevronDown, List } from "lucide-react"
import { HAY_TYPES } from "@/lib/hay-types"
import { useUserLocation } from "@/hooks/use-user-location"
import type { LocationWithSupplier } from "@/lib/types"

type FilterOptions = {
  type: "all" | "broker" | "grower"
  hasInventory: boolean
  deliveryAvailable: boolean
  hayTypes: string[]
  customHayType: string
  zipCode: string
  minPrice: string
  maxPrice: string
  cities: string[]
  states: string[]
  sellingUnits: string[]
}

interface HomeMapViewProps {
  locations: LocationWithSupplier[]
  isAuthenticated?: boolean
  userId?: string | null
  userSupplierId?: string | null
}

export function HomeMapView({ locations, isAuthenticated = false, userId, userSupplierId }: HomeMapViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { location: userLocation, loading: locationLoading } = useUserLocation()
  const [selectedLocation, setSelectedLocation] = useState<LocationWithSupplier | null>(null)
  // Mobile-only state
  const [mobileShowFilters, setMobileShowFilters] = useState(false)
  const [mobileShowListings, setMobileShowListings] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    hasInventory: false,
    deliveryAvailable: false,
    hayTypes: [],
    customHayType: "",
    zipCode: "",
    minPrice: "",
    maxPrice: "",
    cities: [],
    states: [],
    sellingUnits: [],
  })

  const availableCities = useMemo(
    () => [...new Set(locations.map((l) => l.city).filter(Boolean))].sort() as string[],
    [locations],
  )
  const availableStates = useMemo(
    () => [...new Set(locations.map((l) => l.state).filter(Boolean))].sort() as string[],
    [locations],
  )

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const supplier = location.supplier

      const matchesSearch =
        supplier.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.zip_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.inventory &&
          location.inventory.some((item) => item.product_name.toLowerCase().includes(searchTerm.toLowerCase())))

      const matchesType = filters.type === "all" || supplier.supplier_type === filters.type
      const matchesInventory = !filters.hasInventory || (location.inventory && location.inventory.length > 0)
      const matchesDelivery =
        !filters.deliveryAvailable || (location.inventory && location.inventory.some((item) => item.delivery_available))

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
              !HAY_TYPES.filter((t) => t !== "Other").includes(item.product_name)

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

  const toggleHayType = (hayType: string) => {
    setFilters((prev) => ({
      ...prev,
      hayTypes: prev.hayTypes.includes(hayType)
        ? prev.hayTypes.filter((v) => v !== hayType)
        : [...prev.hayTypes, hayType],
    }))
  }

  const toggleSellingUnit = (unit: string) => {
    setFilters((prev) => ({
      ...prev,
      sellingUnits: prev.sellingUnits.includes(unit)
        ? prev.sellingUnits.filter((v) => v !== unit)
        : [...prev.sellingUnits, unit],
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      type: "all",
      hasInventory: false,
      deliveryAvailable: false,
      hayTypes: [],
      customHayType: "",
      zipCode: "",
      minPrice: "",
      maxPrice: "",
      cities: [],
      states: [],
      sellingUnits: [],
    })
    setSearchTerm("")
  }

  const activeFilterCount = [
    filters.type !== "all" ? 1 : 0,
    filters.hasInventory ? 1 : 0,
    filters.deliveryAvailable ? 1 : 0,
    filters.hayTypes.length + (filters.customHayType ? 1 : 0),
    filters.zipCode ? 1 : 0,
    filters.minPrice || filters.maxPrice ? 1 : 0,
    filters.cities.length,
    filters.states.length,
    filters.sellingUnits.length,
  ].reduce((a, b) => a + b, 0)

  const toggleState = (state: string) => {
    setFilters((prev) => ({
      ...prev,
      states: prev.states.includes(state) ? prev.states.filter((v) => v !== state) : [...prev.states, state],
    }))
  }

  const toggleCity = (city: string) => {
    setFilters((prev) => ({
      ...prev,
      cities: prev.cities.includes(city) ? prev.cities.filter((v) => v !== city) : [...prev.cities, city],
    }))
  }

  // Shared filter panel content (used in both mobile and desktop)
  const filterContent = (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Supplier Type */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Supplier Type</Label>
            <RadioGroup
              value={filters.type}
              onValueChange={(value: "all" | "broker" | "grower") => setFilters((prev) => ({ ...prev, type: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="type-all" />
                <Label htmlFor="type-all" className="font-normal cursor-pointer">
                  All
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="broker" id="type-broker" />
                <Label htmlFor="type-broker" className="font-normal cursor-pointer">
                  Broker
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grower" id="type-grower" />
                <Label htmlFor="type-grower" className="font-normal cursor-pointer">
                  Grower
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Hay Type */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Hay Type</Label>
              {filters.hayTypes.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setFilters((prev) => ({ ...prev, hayTypes: [], customHayType: "" }))}
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {HAY_TYPES.map((hayType) => (
                <div key={hayType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`hay-${hayType}`}
                    checked={filters.hayTypes.includes(hayType)}
                    onCheckedChange={() => toggleHayType(hayType)}
                  />
                  <Label htmlFor={`hay-${hayType}`} className="font-normal cursor-pointer text-sm">
                    {hayType}
                  </Label>
                </div>
              ))}
            </div>
            {filters.hayTypes.includes("Other") && (
              <div className="mt-3">
                <Input
                  placeholder="Enter custom hay type..."
                  value={filters.customHayType}
                  onChange={(e) => setFilters((prev) => ({ ...prev, customHayType: e.target.value }))}
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {/* Selling Unit */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Selling Unit</Label>
              {filters.sellingUnits.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setFilters((prev) => ({ ...prev, sellingUnits: [] }))}
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {[
                { value: "tons", label: "Tons" },
                { value: "small_bales", label: "Small Bales" },
                { value: "large_bales", label: "Large Bales" },
              ].map((unit) => (
                <div key={unit.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`unit-${unit.value}`}
                    checked={filters.sellingUnits.includes(unit.value)}
                    onCheckedChange={() => toggleSellingUnit(unit.value)}
                  />
                  <Label htmlFor={`unit-${unit.value}`} className="font-normal cursor-pointer text-sm">
                    {unit.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* ZIP Code */}
          <div>
            <Label htmlFor="zipCode" className="text-sm font-semibold mb-2 block">
              ZIP Code
            </Label>
            <Input
              id="zipCode"
              placeholder="Enter ZIP code"
              value={filters.zipCode}
              onChange={(e) => setFilters((prev) => ({ ...prev, zipCode: e.target.value }))}
            />
          </div>

          {/* Price Range */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Price Range (per unit)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Min"
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
              />
              <Input
                placeholder="Max"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-3 block">Availability</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasInventory"
                  checked={filters.hasInventory}
                  onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, hasInventory: checked as boolean }))}
                />
                <Label htmlFor="hasInventory" className="font-normal cursor-pointer">
                  Has inventory available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delivery"
                  checked={filters.deliveryAvailable}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({ ...prev, deliveryAvailable: checked as boolean }))
                  }
                />
                <Label htmlFor="delivery" className="font-normal cursor-pointer">
                  Offers delivery
                </Label>
              </div>
            </div>
          </div>

          {availableStates.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-3 block">State</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableStates.map((state) => (
                  <div key={state} className="flex items-center space-x-2">
                    <Checkbox
                      id={`state-${state}`}
                      checked={filters.states.includes(state)}
                      onCheckedChange={() => toggleState(state)}
                    />
                    <Label htmlFor={`state-${state}`} className="font-normal cursor-pointer text-sm">
                      {state}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableCities.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-3 block">City</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableCities.map((city) => (
                  <div key={city} className="flex items-center space-x-2">
                    <Checkbox
                      id={`city-${city}`}
                      checked={filters.cities.includes(city)}
                      onCheckedChange={() => toggleCity(city)}
                    />
                    <Label htmlFor={`city-${city}`} className="font-normal cursor-pointer text-sm">
                      {city}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

  )

  // Shared clear button
  const clearButton = activeFilterCount > 0 ? (
    <div className="p-4 border-t border-gray-200 flex-shrink-0">
      <Button onClick={clearAllFilters} variant="outline" className="w-full bg-transparent">
        Clear All Filters
      </Button>
    </div>
  ) : null

  // Shared listing card renderer
  const listingCards = (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {filteredLocations.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No locations match your filters. Try adjusting your search criteria.
        </div>
      ) : (
        filteredLocations.map((location) => (
          <button
            key={location.id}
            onClick={() => {
              setSelectedLocation(location)
              setMobileShowListings(false)
            }}
            className={`w-full p-4 border rounded-xl hover:shadow-lg transition-all duration-200 text-left ${
              selectedLocation?.id === location.id
                ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3 mb-2">
              {location.supplier.logo_url && (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                  <img
                    src={location.supplier.logo_url || "/placeholder.svg"}
                    alt={`${location.supplier.business_name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <div className="font-semibold text-base text-gray-900">{location.supplier.business_name}</div>
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 mt-1 shadow-sm ${
                      location.supplier.supplier_type === "broker" ? "bg-yellow-600" : "bg-green-600"
                    }`}
                  />
                </div>
                <div className="text-sm text-gray-600 capitalize mb-1">
                  {location.supplier.supplier_type === "broker" ? "Broker" : "Grower"} • {location.name}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <div>{location.address}</div>
              <div>
                {location.city}, {location.state} {location.zip_code}
              </div>
            </div>
            {location.inventory.length > 0 && (
              <div className="text-xs text-gray-500">
                {location.inventory.length} item{location.inventory.length !== 1 ? "s" : ""} available
              </div>
            )}
          </button>
        ))
      )}
    </div>
  )

  return (
    <div className="relative w-full h-full">
      {/* ==================== MOBILE LAYOUT (< md) ==================== */}
      <div className="md:hidden absolute inset-0 flex flex-col">
        {/* Mobile search bar floating at top */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/95 backdrop-blur-sm shadow-lg border-gray-200 h-10 text-sm"
            />
          </div>
          <Button
            variant={mobileShowFilters ? "default" : "outline"}
            size="icon"
            className="h-10 w-10 shrink-0 shadow-lg bg-white/95 backdrop-blur-sm"
            onClick={() => { setMobileShowFilters(!mobileShowFilters); setMobileShowListings(false) }}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Full-screen map */}
        <div className="flex-1">
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

        {/* Mobile floating listings toggle button */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
          <Button
            onClick={() => { setMobileShowListings(!mobileShowListings); setMobileShowFilters(false) }}
            className="shadow-lg rounded-full px-5 h-10 gap-2 bg-[#65411C] text-white hover:bg-[#4a2e14]"
          >
            <List className="h-4 w-4" />
            {filteredLocations.length} {filteredLocations.length === 1 ? "Location" : "Locations"}
            {mobileShowListings ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
        </div>

        {/* Mobile filter overlay */}
        {mobileShowFilters && (
          <div className="absolute inset-0 z-20 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-lg">Filters</h3>
                {activeFilterCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileShowFilters(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {filterContent}
            <div className="p-4 border-t border-gray-200 flex-shrink-0 flex gap-2">
              {activeFilterCount > 0 && (
                <Button onClick={clearAllFilters} variant="outline" className="flex-1">
                  Clear All
                </Button>
              )}
              <Button onClick={() => setMobileShowFilters(false)} className="flex-1 bg-[#65411C] hover:bg-[#4a2e14]">
                Show {filteredLocations.length} Results
              </Button>
            </div>
          </div>
        )}

        {/* Mobile listings bottom sheet */}
        {mobileShowListings && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {filteredLocations.length} {filteredLocations.length === 1 ? "Location" : "Locations"}
                </h2>
                <div className="flex gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    <span className="text-[10px] font-medium text-green-900">Grower</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                    <span className="text-[10px] font-medium text-yellow-900">Broker</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileShowListings(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {listingCards}
          </div>
        )}
      </div>

      {/* ==================== DESKTOP LAYOUT (>= md) -- unchanged ==================== */}
      <div className="hidden md:block absolute inset-0">
        {/* Filter sidebar */}
        <div className="absolute left-0 top-0 bottom-0 w-80 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="font-semibold text-lg">Filters</h3>
            {activeFilterCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
              </p>
            )}
          </div>
          {filterContent}
          {clearButton}
        </div>

        {/* Listings panel */}
        <div className="absolute left-80 top-0 bottom-0 w-[450px] border-r bg-gradient-to-b from-white to-gray-50/50 flex flex-col overflow-hidden shadow-lg">
          <div className="p-6 border-b bg-white/80 backdrop-blur-sm flex-shrink-0 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {filteredLocations.length} {filteredLocations.length === 1 ? "Location" : "Locations"}
            </h2>
            <div className="flex gap-3 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <div className="w-2.5 h-2.5 rounded-full bg-green-600 shadow-sm"></div>
                <span className="text-xs font-semibold text-green-900">Grower</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-100">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-600 shadow-sm"></div>
                <span className="text-xs font-semibold text-yellow-900">Broker</span>
              </div>
            </div>
          </div>
          {listingCards}
        </div>

        {/* Map area with search */}
        <div className="absolute left-[770px] top-0 bottom-0 right-0 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search suppliers, products, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1">
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
        </div>
      </div>
    </div>
  )
}
