"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import type { Inventory, StockUnit, SellingUnit } from "@/lib/types"
import { HAY_TYPES } from "@/lib/hay-types"

interface InventoryItemEditProps {
  item: Inventory
  onCancel: () => void
}

export function InventoryItemEdit({ item, onCancel }: InventoryItemEditProps) {
  const isCustomType = !HAY_TYPES.includes(item.product_name as any)
  const [hayType, setHayType] = useState<string>(isCustomType ? "Other" : item.product_name)
  const [customHayType, setCustomHayType] = useState(isCustomType ? item.product_name : "")
  const [productName, setProductName] = useState(item.product_name)
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [stockUnit, setStockUnit] = useState<StockUnit>(item.stock_unit || "tons")
  const [sellingUnit, setSellingUnit] = useState<SellingUnit>(item.selling_unit || "tons")
  const [pricePerUnit, setPricePerUnit] = useState(item.price_per_unit.toString())
  const [deliveryAvailable, setDeliveryAvailable] = useState(item.delivery_available)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const finalProductName = hayType === "Other" ? customHayType : hayType

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("inventory")
        .update({
          product_name: finalProductName,
          quantity: Number.parseFloat(quantity),
          stock_unit: stockUnit,
          selling_unit: sellingUnit,
          price_per_unit: Number.parseFloat(pricePerUnit),
          delivery_available: deliveryAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)

      if (error) throw error

      router.refresh()
      onCancel()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-2 border-green-200">
      <CardContent className="pt-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor={`edit-hay-type-${item.id}`}>Hay Type</Label>
            <Select value={hayType} onValueChange={setHayType} required>
              <SelectTrigger id={`edit-hay-type-${item.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HAY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hayType === "Other" && (
            <div className="grid gap-2">
              <Label htmlFor={`edit-custom-hay-type-${item.id}`}>Specify Hay Type</Label>
              <Input
                id={`edit-custom-hay-type-${item.id}`}
                value={customHayType}
                onChange={(e) => setCustomHayType(e.target.value)}
                placeholder="Enter hay type name"
                required
              />
            </div>
          )}

          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-sm mb-3">Stock Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`edit-quantity-${item.id}`}>Quantity in Stock</Label>
                <Input
                  id={`edit-quantity-${item.id}`}
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-stock-unit-${item.id}`}>Stock Unit</Label>
                <Select value={stockUnit} onValueChange={(value: StockUnit) => setStockUnit(value)}>
                  <SelectTrigger id={`edit-stock-unit-${item.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tons">Tons</SelectItem>
                    <SelectItem value="large_bales">Large Bales</SelectItem>
                    <SelectItem value="small_bales">Small Bales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-green-50">
            <h4 className="font-medium text-sm mb-3">Pricing Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`edit-price-${item.id}`}>Price</Label>
                <Input
                  id={`edit-price-${item.id}`}
                  type="number"
                  step="0.01"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-selling-unit-${item.id}`}>Selling Unit</Label>
                <Select value={sellingUnit} onValueChange={(value: SellingUnit) => setSellingUnit(value)}>
                  <SelectTrigger id={`edit-selling-unit-${item.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tons">Per Ton</SelectItem>
                    <SelectItem value="large_bales">Per Large Bale</SelectItem>
                    <SelectItem value="small_bales">Per Small Bale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`edit-delivery-${item.id}`}
              checked={deliveryAvailable}
              onCheckedChange={(checked) => setDeliveryAvailable(checked as boolean)}
            />
            <Label htmlFor={`edit-delivery-${item.id}`} className="text-sm font-normal cursor-pointer">
              Delivery available
            </Label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
