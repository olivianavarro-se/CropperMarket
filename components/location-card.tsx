"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Phone, MapPin, Package, Mail, Lock } from "lucide-react"
import type { LocationWithSupplier } from "@/lib/types"
import { getStockUnitLabel, getSellingUnitLabel } from "@/lib/unit-labels"
import { HAY_TYPES } from "@/lib/hay-types"
import { useMemo } from "react"
import { ContactSupplierDialog } from "@/components/contact-supplier-dialog"

interface LocationCardProps {
  location: LocationWithSupplier
  onClose: () => void
  isAuthenticated?: boolean
  activeFilters?: any // Added activeFilters to filter displayed inventory
  userId?: string | null
}

export function LocationCard({ location, onClose, isAuthenticated = false, activeFilters, userId }: LocationCardProps) {
  const router = useRouter()
  const supplier = location.supplier
  const [showContactDialog, setShowContactDialog] = useState(false)

  const filteredInventory = useMemo(() => {
    if (!activeFilters) return location.inventory

    return location.inventory.filter((item) => {
      // Filter by hay type - only check if hay type filter is active
      const hayTypeFilterActive = activeFilters.hayTypes.length > 0 || activeFilters.customHayType
      const matchesHayType =
        !hayTypeFilterActive ||
        activeFilters.hayTypes.filter((t: string) => t !== "Other").includes(item.product_name) ||
        (activeFilters.hayTypes.includes("Other") &&
          activeFilters.customHayType &&
          item.product_name.toLowerCase().includes(activeFilters.customHayType.toLowerCase())) ||
        (activeFilters.hayTypes.includes("Other") &&
          !activeFilters.customHayType &&
          !HAY_TYPES.filter((t) => t !== "Other").includes(item.product_name))

      // Filter by price range - only check if price filter is active
      const priceFilterActive = activeFilters.minPrice || activeFilters.maxPrice
      const minPrice = activeFilters.minPrice ? Number.parseFloat(activeFilters.minPrice) : 0
      const maxPrice = activeFilters.maxPrice ? Number.parseFloat(activeFilters.maxPrice) : Number.POSITIVE_INFINITY
      const price = Number.parseFloat(String(item.price_per_unit))
      const matchesPriceRange = !priceFilterActive || (price >= minPrice && price <= maxPrice)

      // Filter by selling unit - only check if selling unit filter is active
      const sellingUnitFilterActive = activeFilters.sellingUnits.length > 0
      const matchesSellingUnit =
        !sellingUnitFilterActive ||
        (item.pricing_options && item.pricing_options.length > 0
          ? item.pricing_options.some((option: any) => activeFilters.sellingUnits.includes(option.unit))
          : item.selling_unit && activeFilters.sellingUnits.includes(item.selling_unit))

      // Filter by delivery availability - only check if delivery filter is active
      const deliveryFilterActive = activeFilters.deliveryAvailable
      const matchesDelivery = !deliveryFilterActive || item.delivery_available

      // Item must match ALL active filters
      return matchesHayType && matchesPriceRange && matchesSellingUnit && matchesDelivery
    })
  }, [location.inventory, activeFilters])

  const hasDelivery = filteredInventory.some((item) => item.delivery_available)

  const handleContactClick = () => {
    if (!isAuthenticated) {
      router.push("/auth/login")
    } else {
      setShowContactDialog(true)
    }
  }

  return (
    <Card className="shadow-2xl border-0 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-yellow-50 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {supplier.logo_url && (
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-gray-200 shrink-0">
                <img
                  src={supplier.logo_url || "/placeholder.svg"}
                  alt={`${supplier.business_name} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-xl mb-1">{supplier.business_name}</CardTitle>
              <p className="text-sm text-gray-600 mb-2">{location.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={
                    supplier.supplier_type === "broker" 
                      ? "bg-yellow-50 border-yellow-200 text-yellow-800 shadow-sm" 
                      : "bg-green-50 border-green-200 text-green-800 shadow-sm"
                  }
                >
                  {supplier.supplier_type === "broker" ? "Broker" : "Grower"}
                </Badge>
                {hasDelivery && (
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 shadow-sm">
                    Delivery Available
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 hover:bg-white/50">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
          <div className="flex flex-col text-gray-700 leading-relaxed">
            <span className="font-medium">{location.address}</span>
            <span>
              {location.city}, {location.state} {location.zip_code}
            </span>
          </div>
        </div>

        {isAuthenticated ? (
          supplier.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{supplier.email}</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
            <Lock className="h-4 w-4" />
            <span className="italic">Sign in to view contact information</span>
          </div>
        )}

        {isAuthenticated ? (
          supplier.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{supplier.phone}</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
            <Lock className="h-4 w-4" />
            <span className="italic">Sign in to view phone number</span>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4" />
                <h3 className="font-semibold">Inventory at this Location</h3>
              </div>
              <div className="flex items-center gap-3 ml-6">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${supplier.supplier_type === "broker" ? "bg-yellow-500" : "bg-green-600"}`}></div>
                  <span className="text-xs text-gray-600">
                    {supplier.delivery_available ? "Delivery Available" : "No Delivery"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {filteredInventory.length > 0 ? (
            <div className="space-y-3">
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-green-50/30 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.product_name}</div>
                    {item.description && <div className="text-xs text-gray-500 mt-1 italic">{item.description}</div>}
                    <div className="text-xs text-gray-600 mt-1">
                      {item.quantity} {getStockUnitLabel(item.stock_unit || "tons")} in stock
                      {item.delivery_available && " • Delivery available"}
                    </div>
                  </div>
                  <div className="text-right">
                    {item.pricing_options && item.pricing_options.length > 0 ? (
                      <div className="space-y-1">
                        {item.pricing_options.map((option, idx) => (
                          <div key={idx} className="text-right">
                            <div className="font-semibold text-green-700">${option.price}</div>
                            <div className="text-xs text-gray-500">{getSellingUnitLabel(option.unit)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-green-700">${item.price_per_unit}</div>
                        <div className="text-xs text-gray-500">{getSellingUnitLabel(item.selling_unit || "tons")}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {location.inventory.length > 0 ? "No inventory items match the current filters" : "No inventory listed"}
            </p>
          )}
        </div>

        <Button
          className="w-full shadow-md hover:shadow-lg transition-all"
          onClick={handleContactClick}
        >
          {!isAuthenticated ? (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Sign In to Contact Supplier
            </>
          ) : (
            "Contact Supplier"
          )}
        </Button>
      </CardContent>

      {isAuthenticated && userId && (
        <ContactSupplierDialog
          open={showContactDialog}
          onOpenChange={setShowContactDialog}
          location={location}
          userId={userId}
        />
      )}
    </Card>
  )
}
