"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Phone, MapPin, Package, Mail, Lock } from "lucide-react"
import type { Supplier, Inventory } from "@/lib/types"
import { getStockUnitLabel, getSellingUnitLabel } from "@/lib/unit-labels"

interface SupplierWithInventory extends Supplier {
  inventory: Inventory[]
}

interface SupplierCardProps {
  supplier: SupplierWithInventory
  onClose: () => void
  isAuthenticated?: boolean
}

export function SupplierCard({ supplier, onClose, isAuthenticated = false }: SupplierCardProps) {
  const router = useRouter()
  const hasDelivery = supplier.inventory.some((item) => item.delivery_available)

  const handleContactClick = () => {
    if (!isAuthenticated) {
      router.push("/auth/login")
    } else if (supplier.email) {
      window.location.href = `mailto:${supplier.email}?subject=Inquiry about ${supplier.business_name}`
    }
  }

  return (
    <Card className="shadow-2xl border-0 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-yellow-50 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{supplier.business_name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={supplier.supplier_type === "broker" ? "default" : "secondary"} className="shadow-sm">
                {supplier.supplier_type === "broker" ? "Broker" : "Grower"}
              </Badge>
              {hasDelivery && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 shadow-sm">
                  Delivery Available
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 hover:bg-white/50">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {supplier.description && <p className="text-sm text-gray-600">{supplier.description}</p>}

        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
          <div className="flex flex-col text-gray-700 leading-relaxed">
            {supplier.address && <span className="font-medium">{supplier.address}</span>}
            {(supplier.city || supplier.state || supplier.zip_code) && (
              <span>
                {supplier.city}
                {supplier.state && `, ${supplier.state}`}
                {supplier.zip_code && ` ${supplier.zip_code}`}
              </span>
            )}
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
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4" />
            <h3 className="font-semibold">Inventory</h3>
          </div>

          {supplier.inventory.length > 0 ? (
            <div className="space-y-3">
              {supplier.inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-green-50/30 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.product_name}</div>
                    <div className="text-xs text-gray-600">
                      {item.quantity} {getStockUnitLabel(item.stock_unit || "tons")} in stock
                      {item.delivery_available && " • Delivery available"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-700">${item.price_per_unit}</div>
                    <div className="text-xs text-gray-500">{getSellingUnitLabel(item.selling_unit || "tons")}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No inventory listed</p>
          )}
        </div>

        <Button
          className="w-full shadow-md hover:shadow-lg transition-all"
          onClick={handleContactClick}
          disabled={!supplier.email && isAuthenticated}
        >
          {!isAuthenticated ? (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Sign In to Contact Supplier
            </>
          ) : supplier.email ? (
            "Contact Supplier"
          ) : (
            "No Contact Email"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
