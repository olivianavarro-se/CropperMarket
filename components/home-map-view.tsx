"use client"

import { useState, useMemo } from "react"
import { MapView } from "@/components/map-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Search } from "lucide-react"
import { HAY_TYPES } from "@/lib/hay-types"
import { useUserLocation } from "@/hooks/use-user-location"
import type { Supplier, Inventory } from "@/lib/types"

interface SupplierWithInventory extends Supplier {
  inventory: Inventory[]
}

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
}

interface HomeMapViewProps {
  suppliers: SupplierWithInventory[]
  isAuthenticated?: boolean
}

export function HomeMapView({ suppliers, isAuthenticated = false }: HomeMapViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { location: userLocation, loading: locationLoading } = useUserLocation()
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithInventory | null>(null)
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
  })

  const availableCities = useMemo(
    () => [...new Set(suppliers.map((s) => s.city).filter(Boolean))].sort() as string[],
    [suppliers],
  )
  const availableStates = useMemo(
    () => [...new Set(suppliers.map((s) => s.state).filter(Boolean))].sort() as string[],
    [suppliers],
  )

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.zip_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.inventory &&
          supplier.inventory.some((item) => item.product_name.toLowerCase().includes(searchTerm.toLowerCase())))

      const matchesType = filters.type === "all" || supplier.supplier_type === filters.type
      const matchesInventory = !filters.hasInventory || (supplier.inventory && supplier.inventory.length > 0)
      const matchesDelivery =
        !filters.deliveryAvailable || (supplier.inventory && supplier.inventory.some((item) => item.delivery_available))

      const matchesZipCode = !filters.zipCode || supplier.zip_code?.includes(filters.zipCode)

      const matchesCities = filters.cities.length === 0 || (supplier.city && filters.cities.includes(supplier.city))
      const matchesStates = filters.states.length === 0 || (supplier.state && filters.states.includes(supplier.state))

      const matchesHayType =
        (filters.hayTypes.length === 0 && !filters.customHayType) ||
        (supplier.inventory &&
          supplier.inventory.some((item) => {
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
        (supplier.inventory &&
          supplier.inventory.some((item) => {
            const price = Number.parseFloat(item.price_per_unit)
            return price >= minPrice && price <= maxPrice
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
        matchesPriceRange
      )
    })
  }, [searchTerm, filters, suppliers])

  const toggleHayType = (hayType: string) => {
    setFilters((prev) => ({
      ...prev,
      hayTypes: prev.hayTypes.includes(hayType)
        ? prev.hayTypes.filter((v) => v !== hayType)
        : [...prev.hayTypes, hayType],
    }))
  }

  const toggleCity = (city: string) => {
    setFilters((prev) => ({
      ...prev,
      cities: prev.cities.includes(city) ? prev.cities.filter((v) => v !== city) : [...prev.cities, city],
    }))
  }

  const toggleState = (state: string) => {
    setFilters((prev) => ({
      ...prev,
      states: prev.states.includes(state) ? prev.states.filter((v) => v !== state) : [...prev.states, state],
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
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="relative w-full h-full">
      <div className="absolute left-0 top-0 bottom-0 w-80 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-semibold text-lg">Filters</h3>
          {activeFilterCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
            </p>
          )}
        </div>

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

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <Button onClick={clearAllFilters} variant="outline" className="w-full bg-transparent">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      <div className="absolute left-80 top-0 bottom-0 w-[450px] border-r bg-gradient-to-b from-white to-gray-50/50 flex flex-col overflow-hidden shadow-lg">
        <div className="p-6 border-b bg-white/80 backdrop-blur-sm flex-shrink-0 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {filteredSuppliers.length} {filteredSuppliers.length === 1 ? "Supplier" : "Suppliers"}
          </h2>

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

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No suppliers match your filters. Try adjusting your search criteria.
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
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
                  {supplier.supplier_type === "broker" ? "Broker" : "Grower"}
                </div>
                {(supplier.address || supplier.city || supplier.state) && (
                  <div className="text-sm text-gray-600 mb-2">
                    {supplier.address && <div>{supplier.address}</div>}
                    <div>
                      {supplier.city}
                      {supplier.state && `, ${supplier.state}`}
                      {supplier.zip_code && ` ${supplier.zip_code}`}
                    </div>
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

      <div className="fixed left-[770px] top-16 bottom-0 right-0 flex flex-col">
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
            suppliers={filteredSuppliers}
            isAuthenticated={isAuthenticated}
            userLocation={userLocation}
            selectedSupplier={selectedSupplier}
            onSupplierSelect={setSelectedSupplier}
          />
        </div>
      </div>
    </div>
  )
}
