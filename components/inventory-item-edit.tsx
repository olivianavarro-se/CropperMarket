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
import type { Inventory } from "@/lib/types"

interface InventoryItemEditProps {
  item: Inventory
  onCancel: () => void
}

export function InventoryItemEdit({ item, onCancel }: InventoryItemEditProps) {
  const [productName, setProductName] = useState(item.product_name)
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [unit, setUnit] = useState(item.unit)
  const [pricePerUnit, setPricePerUnit] = useState(item.price_per_unit.toString())
  const [deliveryAvailable, setDeliveryAvailable] = useState(item.delivery_available)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("inventory")
        .update({
          product_name: productName,
          quantity: Number.parseFloat(quantity),
          unit,
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
            <Label htmlFor={`edit-product-name-${item.id}`}>Product Name</Label>
            <Input
              id={`edit-product-name-${item.id}`}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`edit-quantity-${item.id}`}>Quantity</Label>
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
              <Label htmlFor={`edit-unit-${item.id}`}>Unit</Label>
              <Select value={unit} onValueChange={(value: "tons" | "bales") => setUnit(value)}>
                <SelectTrigger id={`edit-unit-${item.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tons">Tons</SelectItem>
                  <SelectItem value="bales">Bales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`edit-price-${item.id}`}>Price per Unit</Label>
            <Input
              id={`edit-price-${item.id}`}
              type="number"
              step="0.01"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              required
            />
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
