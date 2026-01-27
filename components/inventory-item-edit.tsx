"use client"

import type React from "react"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { Inventory, StockUnit, SellingUnit, PricingOption } from "@/lib/types"
import { HAY_TYPES } from "@/lib/hay-types"
import { X, Plus } from "lucide-react"

interface InventoryItemEditProps {
  item: Inventory
  onCancel: () => void
}

export function InventoryItemEdit({ item, onCancel }: InventoryItemEditProps) {
  const isCustomType = !HAY_TYPES.includes(item.product_name as any)
  const [hayType, setHayType] = useState<string>(isCustomType ? "Other" : item.product_name)
  const [customHayType, setCustomHayType] = useState(isCustomType ? item.product_name : "")
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [stockUnit, setStockUnit] = useState<StockUnit>(item.stock_unit || "tons")

  const initialPricingOptions: PricingOption[] =
    item.pricing_options && item.pricing_options.length > 0
      ? item.pricing_options
      : [{ price: item.price_per_unit, unit: item.selling_unit || "tons" }]

  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>(initialPricingOptions)
  const [description, setDescription] = useState(item.description || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const addPricingOption = () => {
    setPricingOptions([...pricingOptions, { price: 0, unit: "tons" }])
  }

  const removePricingOption = (index: number) => {
    if (pricingOptions.length > 1) {
      setPricingOptions(pricingOptions.filter((_, i) => i !== index))
    }
  }

  const updatePricingOption = (index: number, field: "price" | "unit", value: number | SellingUnit) => {
    const updated = [...pricingOptions]
    if (field === "price") {
      updated[index].price = value as number
    } else {
      updated[index].unit = value as SellingUnit
    }
    setPricingOptions(updated)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const finalProductName = hayType === "Other" ? customHayType : hayType

    if (pricingOptions.some((option) => option.price <= 0)) {
      setError("All pricing options must have a price greater than 0")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("inventory")
        .update({
          product_name: finalProductName,
          quantity: Number.parseFloat(quantity),
          stock_unit: stockUnit,
          pricing_options: pricingOptions,
          price_per_unit: pricingOptions[0].price,
          selling_unit: pricingOptions[0].unit,
          description: description || null,
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

          <div className="grid gap-2">
            <Label htmlFor={`edit-description-${item.id}`}>Description (Optional)</Label>
            <Textarea
              id={`edit-description-${item.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any details about this item (e.g., quality, origin, storage conditions)"
              rows={2}
            />
          </div>

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
            <h4 className="font-medium text-sm mb-3">Pricing Options</h4>

            <div className="space-y-3">
              {pricingOptions.map((option, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor={`edit-price-${item.id}-${index}`} className="text-xs">
                        Price
                      </Label>
                      <Input
                        id={`edit-price-${item.id}-${index}`}
                        type="number"
                        step="0.01"
                        value={option.price || ""}
                        onChange={(e) => updatePricingOption(index, "price", Number.parseFloat(e.target.value))}
                        placeholder="0.00"
                        required
                        className="h-9"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor={`edit-unit-${item.id}-${index}`} className="text-xs">
                        Per Unit
                      </Label>
                      <Select
                        value={option.unit}
                        onValueChange={(value: SellingUnit) => updatePricingOption(index, "unit", value)}
                      >
                        <SelectTrigger id={`edit-unit-${item.id}-${index}`} className="h-9">
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
                  {pricingOptions.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removePricingOption(index)}
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              <Button
                type="button"
                onClick={addPricingOption}
                size="sm"
                variant="outline"
                className="w-full h-9 bg-transparent"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Price
              </Button>
              <p className="text-xs text-muted-foreground">Multiple price options available</p>
            </div>
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
