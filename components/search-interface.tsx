"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Sliders, Mail, Phone, Package, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Supplier, Inventory } from "@/lib/types"
import { HAY_TYPES } from "@/lib/hay-types"
import { getStockUnitLabel, getSellingUnitLabel } from "@/lib/unit-labels"

type SupplierWithInventory = Supplier & {
  inventory: Inventory[]
}

export function SearchInterface({
  suppliers,
  isAuthenticated = false,
}: { suppliers: SupplierWithInventory[]; isAuthenticated?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(true)
  const [filters, setFilters] = useState<{
    type: "all" | "broker" | "grower"
    hasInventory: boolean
    deliveryAvailable: boolean
    cities: string[]
    states: string[]
    hayTypes: string[]
    zipCode: string
    minPrice: string
    maxPrice: string
  }>({
    type: "all",
    hasInventory: false,
    deliveryAvailable: false,
    cities: [],
    states: [],
    hayTypes: [],
    zipCode: "",
    minPrice: "",
    maxPrice: "",
  })

  const router = useRouter()

  const availableCities = [...new Set(suppliers.map((s) => s.city).filter(Boolean))].sort()
  const availableStates = [...new Set(suppliers.map((s) => s.state).filter(Boolean))].sort()

  const filteredResults = useMemo(() => {
    return suppliers
      .filter((supplier) => {
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
          !filters.deliveryAvailable ||
          (supplier.inventory && supplier.inventory.some((item) => item.delivery_available))

        const matchesCities = filters.cities.length === 0 || (supplier.city && filters.cities.includes(supplier.city))
        const matchesStates = filters.states.length === 0 || (supplier.state && filters.states.includes(supplier.state))

        const matchesZipCode = !filters.zipCode || supplier.zip_code?.includes(filters.zipCode)

        const matchesHayType =
          filters.hayTypes.length === 0 ||
          (supplier.inventory && supplier.inventory.some((item) => filters.hayTypes.includes(item.product_name)))

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
          matchesCities &&
          matchesStates &&
          matchesZipCode &&
          matchesHayType &&
          matchesPriceRange
        )
      })
      .map((supplier) => {
        // If no filters are active and no search term, show all inventory
        if (
          !searchTerm &&
          filters.hayTypes.length === 0 &&
          !filters.minPrice &&
          !filters.maxPrice &&
          !filters.deliveryAvailable
        ) {
          return supplier
        }

        // Filter inventory items based on search term and active filters
        const filteredInventory = supplier.inventory.filter((item) => {
          // Match search term against product name
          const matchesSearchTerm = !searchTerm || item.product_name.toLowerCase().includes(searchTerm.toLowerCase())

          const matchesHayType = filters.hayTypes.length === 0 || filters.hayTypes.includes(item.product_name)

          const minPrice = filters.minPrice ? Number.parseFloat(filters.minPrice) : 0
          const maxPrice = filters.maxPrice ? Number.parseFloat(filters.maxPrice) : Number.POSITIVE_INFINITY
          const price = Number.parseFloat(item.price_per_unit)
          const matchesPrice = price >= minPrice && price <= maxPrice

          const matchesDelivery = !filters.deliveryAvailable || item.delivery_available

          return matchesSearchTerm && matchesHayType && matchesPrice && matchesDelivery
        })

        // Return supplier with filtered inventory
        return {
          ...supplier,
          inventory: filteredInventory,
        }
      })
  }, [searchTerm, filters, suppliers])

  const toggleFilter = (type: "cities" | "states" | "hayTypes", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value) ? prev[type].filter((v) => v !== value) : [...prev[type], value],
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      type: "all",
      hasInventory: false,
      deliveryAvailable: false,
      cities: [],
      states: [],
      hayTypes: [],
      zipCode: "",
      minPrice: "",
      maxPrice: "",
    })
    setSearchTerm("")
  }

  const activeFilterCount = [
    filters.type !== "all" ? 1 : 0,
    filters.hasInventory ? 1 : 0,
    filters.deliveryAvailable ? 1 : 0,
    filters.cities.length,
    filters.states.length,
    filters.hayTypes.length,
    filters.zipCode ? 1 : 0,
    filters.minPrice || filters.maxPrice ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const handleEmailClick = (e: React.MouseEvent, email: string, businessName: string) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      router.push("/auth/login")
    } else {
      window.location.href = `mailto:${email}?subject=Inquiry about ${businessName}`
    }
  }

  const handlePhoneClick = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      router.push("/auth/login")
    } else {
      window.location.href = `tel:${phone}`
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent">
          Search Suppliers
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search suppliers, products, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base shadow-sm"
              autoFocus
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className="shadow-sm"
          >
            <Sliders className="w-4 h-4 mr-2" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="space-y-4">
            <Card className="shadow-md">
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Filters</h3>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Type Filter */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Supplier Type</h4>
                  <div className="space-y-2">
                    {(["all", "broker", "grower"] as const).map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          checked={filters.type === type}
                          onChange={() => setFilters((prev) => ({ ...prev, type }))}
                          className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm capitalize">{type === "all" ? "All Suppliers" : type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Hay Type Filter */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Hay Type</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {HAY_TYPES.filter((type) => type !== "Other").map((hayType) => (
                      <label key={hayType} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hayTypes.includes(hayType)}
                          onChange={() => toggleFilter("hayTypes", hayType)}
                          className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm">{hayType}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ZIP Code Filter */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">ZIP Code</h4>
                  <Input
                    type="text"
                    placeholder="Enter ZIP code"
                    value={filters.zipCode}
                    onChange={(e) => setFilters((prev) => ({ ...prev, zipCode: e.target.value }))}
                    className="h-9"
                  />
                </div>

                {/* Price Range Filter */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Price Range (per unit)</h4>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min price"
                      value={filters.minPrice}
                      onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                      className="h-9"
                      min="0"
                      step="0.01"
                    />
                    <Input
                      type="number"
                      placeholder="Max price"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                      className="h-9"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Inventory Filter */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Availability</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.hasInventory}
                        onChange={(e) => setFilters((prev) => ({ ...prev, hasInventory: e.target.checked }))}
                        className="w-4 h-4 accent-green-600"
                      />
                      <span className="text-sm">Has inventory available</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.deliveryAvailable}
                        onChange={(e) => setFilters((prev) => ({ ...prev, deliveryAvailable: e.target.checked }))}
                        className="w-4 h-4 accent-green-600"
                      />
                      <span className="text-sm">Offers delivery</span>
                    </label>
                  </div>
                </div>

                {/* States Filter */}
                {availableStates.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">State</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableStates.map((state) => (
                        <label key={state} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.states.includes(state)}
                            onChange={() => toggleFilter("states", state)}
                            className="w-4 h-4 accent-green-600"
                          />
                          <span className="text-sm">{state}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cities Filter */}
                {availableCities.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">City</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableCities.map((city) => (
                        <label key={city} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.cities.includes(city)}
                            onChange={() => toggleFilter("cities", city)}
                            className="w-4 h-4 accent-green-600"
                          />
                          <span className="text-sm">{city}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Found <span className="font-semibold">{filteredResults.length}</span> supplier
              {filteredResults.length !== 1 ? "s" : ""}
            </p>
          </div>

          {filteredResults.length > 0 ? (
            <div className="space-y-4">
              {filteredResults.map((supplier) => (
                <Card
                  key={supplier.id}
                  className="hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{supplier.business_name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={supplier.supplier_type === "broker" ? "default" : "secondary"}
                            className="capitalize shadow-sm"
                          >
                            {supplier.supplier_type}
                          </Badge>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {supplier.address && `${supplier.address}, `}
                            {supplier.city}, {supplier.state} {supplier.zip_code}
                          </p>
                        </div>
                      </div>
                    </div>

                    {supplier.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{supplier.description}</p>
                    )}

                    {/* Inventory Section */}
                    {supplier.inventory && supplier.inventory.length > 0 && (
                      <div className="mb-4 pb-4 border-b">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-green-600" />
                          <h4 className="font-semibold text-sm">Available Products ({supplier.inventory.length})</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {supplier.inventory.slice(0, 4).map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                            >
                              <div>
                                <span className="font-medium">{item.product_name}</span>
                                <span className="text-xs text-gray-500 ml-1">
                                  ({item.quantity} {getStockUnitLabel(item.stock_unit || "tons")})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <span className="text-green-700 font-semibold">${item.price_per_unit}</span>
                                  <span className="text-xs text-gray-500 ml-1">
                                    {getSellingUnitLabel(item.selling_unit || "tons")}
                                  </span>
                                </div>
                                {item.delivery_available && (
                                  <Badge variant="outline" className="text-xs">
                                    Delivery
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {supplier.inventory.length > 4 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            +{supplier.inventory.length - 4} more products
                          </p>
                        )}
                      </div>
                    )}

                    {/* Contact Section */}
                    <div className="flex flex-wrap gap-3">
                      {isAuthenticated ? (
                        <>
                          {supplier.email && (
                            <button
                              onClick={(e) => handleEmailClick(e, supplier.email!, supplier.business_name)}
                              className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800 transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                              Email
                            </button>
                          )}
                          {supplier.phone && (
                            <button
                              onClick={(e) => handlePhoneClick(e, supplier.phone)}
                              className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              Call
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push("/auth/login")
                          }}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors bg-gray-50 px-3 py-1.5 rounded"
                        >
                          <Lock className="w-4 h-4" />
                          Sign in to view contact info
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-md">
              <CardContent className="pt-6 text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No suppliers found matching your criteria</p>
                <div className="space-y-2">
                  <p className="text-sm">Try:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Adjusting your filters</li>
                    <li>Searching with different keywords</li>
                    <li>Clearing all filters to browse all suppliers</li>
                  </ul>
                </div>
                <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-4 bg-transparent">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
