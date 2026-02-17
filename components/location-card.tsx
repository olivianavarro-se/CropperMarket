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
  userSupplierId?: string | null
}

export function LocationCard({ location, onClose, isAuthenticated = false, activeFilters, userId, userSupplierId }: LocationCardProps) {
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

  const isOwnFarm = userSupplierId && userSupplierId === supplier.id

  return (
    <Card className="shadow-2xl border-0 overflow-hidden text-sm">
      <CardHeader className="p-3 md:p-4 pb-2 md:pb-3 bg-card border-b border-hay-border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {supplier.logo_url && (
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden bg-white border-2 border-hay-border shrink-0">
                <img
                  src={supplier.logo_url || "/placeholder.svg"}
                  alt={`${supplier.business_name} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base md:text-lg mb-0.5 truncate">{supplier.business_name}</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground mb-1.5">{location.name}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0 md:py-0.5 ${
                    supplier.supplier_type === "broker" 
                      ? "bg-broker-bg border-broker-border text-broker shadow-sm" 
                      : "bg-grower-bg border-grower-border text-grower shadow-sm"
                  }`}
                >
                  {supplier.supplier_type === "broker" ? "Broker" : "Grower"}
                </Badge>
                {hasDelivery && (
                  <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 md:px-2 py-0 md:py-0.5 bg-grower-bg border-grower-border text-grower shadow-sm">
                    Delivery
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 hover:bg-white/50 h-7 w-7 md:h-8 md:w-8">
            <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 md:space-y-3 p-3 md:p-4 pt-2.5 md:pt-3">
        <div className="flex items-start gap-2 text-xs md:text-sm">
          <MapPin className="h-3.5 w-3.5 mt-0.5 text-hay-gold shrink-0" />
          <div className="flex flex-col text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">{location.address}</span>
            <span>
              {location.city}, {location.state} {location.zip_code}
            </span>
          </div>
        </div>

        {isAuthenticated ? (
          supplier.email && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{supplier.email}</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground bg-muted p-1.5 md:p-2 rounded">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span className="italic">Sign in to view contact info</span>
          </div>
        )}

        {isAuthenticated ? (
          supplier.phone && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{supplier.phone}</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground bg-muted p-1.5 md:p-2 rounded">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span className="italic">Sign in to view phone</span>
          </div>
        )}

        <div className="border-t border-hay-border pt-2.5 md:pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="h-3.5 w-3.5 text-hay-gold" />
            <h3 className="font-semibold text-xs md:text-sm">Inventory</h3>
            {location.delivery_available && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto bg-grower-bg border-grower-border text-grower">
                Delivery
              </Badge>
            )}
          </div>

          {filteredInventory.length > 0 ? (
            <div className="space-y-1.5 md:space-y-2">
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 md:p-2.5 bg-muted/50 rounded-lg border border-border hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs md:text-sm truncate">{item.product_name}</div>
                    {item.description && <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 italic truncate">{item.description}</div>}
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                      {item.quantity} {getStockUnitLabel(item.stock_unit || "tons")} in stock
                      {item.delivery_available && " • Delivery"}
                    </div>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    {item.pricing_options && item.pricing_options.length > 0 ? (
                      <div className="space-y-0.5">
                        {item.pricing_options.map((option, idx) => (
                          <div key={idx} className="text-right">
                            <div className="font-semibold text-xs md:text-sm text-hay-dark">${option.price}</div>
                            <div className="text-[10px] md:text-xs text-muted-foreground">{getSellingUnitLabel(option.unit)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-xs md:text-sm text-hay-dark">${item.price_per_unit}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground">{getSellingUnitLabel(item.selling_unit || "tons")}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {location.inventory.length > 0 ? "No items match filters" : "No inventory listed"}
            </p>
          )}
        </div>

        {!isOwnFarm && (
          <Button
            size="sm"
            className="w-full shadow-md hover:shadow-lg transition-all h-8 md:h-9 text-xs md:text-sm bg-hay-dark hover:bg-hay-dark-hover text-white"
            onClick={handleContactClick}
          >
            {!isAuthenticated ? (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Sign In to Contact
              </>
            ) : (
              "Contact Supplier"
            )}
          </Button>
        )}
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
