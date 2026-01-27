"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Package, Edit2 } from "lucide-react"
import type { Inventory, StockUnit, SellingUnit } from "@/lib/types"
import { InventoryItemEdit } from "@/components/inventory-item-edit"
import { HAY_TYPES } from "@/lib/hay-types"
import { getStockUnitLabel, getSellingUnitLabel } from "@/lib/unit-labels"

interface InventoryListProps {
  inventory: Inventory[]
  supplierId: string
}

export function InventoryList({ inventory, supplierId }: InventoryListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [productName, setProductName] = useState("")
  const [hayType, setHayType] = useState<string>("")
  const [customHayType, setCustomHayType] = useState("")
  const [quantity, setQuantity] = useState("")
  const [stockUnit, setStockUnit] = useState<StockUnit>("tons")
  const [sellingUnit, setSellingUnit] = useState<SellingUnit>("tons")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [deliveryAvailable, setDeliveryAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const finalProductName = hayType === "Other" ? customHayType : hayType

    const supabase = createClient()

    try {
      const { error } = await supabase.from("inventory").insert({
        supplier_id: supplierId,
        product_name: finalProductName,
        quantity: Number.parseFloat(quantity),
        stock_unit: stockUnit,
        selling_unit: sellingUnit,
        price_per_unit: Number.parseFloat(pricePerUnit),
        delivery_available: deliveryAvailable,
      })

      if (error) throw error

      setHayType("")
      setCustomHayType("")
      setProductName("")
      setQuantity("")
      setStockUnit("tons")
      setSellingUnit("tons")
      setPricePerUnit("")
      setDeliveryAvailable(false)
      setIsAdding(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("inventory").delete().eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>Inventory</CardTitle>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="hay-type">Hay Type</Label>
                  <Select value={hayType} onValueChange={setHayType} required>
                    <SelectTrigger id="hay-type">
                      <SelectValue placeholder="Select hay type" />
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
                    <Label htmlFor="custom-hay-type">Specify Hay Type</Label>
                    <Input
                      id="custom-hay-type"
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
                      <Label htmlFor="quantity">Quantity in Stock</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock-unit">Stock Unit</Label>
                      <Select value={stockUnit} onValueChange={(value: StockUnit) => setStockUnit(value)}>
                        <SelectTrigger id="stock-unit">
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
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={pricePerUnit}
                        onChange={(e) => setPricePerUnit(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="selling-unit">Selling Unit</Label>
                      <Select value={sellingUnit} onValueChange={(value: SellingUnit) => setSellingUnit(value)}>
                        <SelectTrigger id="selling-unit">
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
                    id="delivery"
                    checked={deliveryAvailable}
                    onCheckedChange={(checked) => setDeliveryAvailable(checked as boolean)}
                  />
                  <Label htmlFor="delivery" className="text-sm font-normal cursor-pointer">
                    Delivery available
                  </Label>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false)
                      setHayType("")
                      setCustomHayType("")
                      setStockUnit("tons")
                      setSellingUnit("tons")
                      setError(null)
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Adding..." : "Add Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {inventory.length > 0 ? (
          <div className="space-y-3">
            {inventory.map((item) =>
              editingId === item.id ? (
                <InventoryItemEdit key={item.id} item={item} onCancel={() => setEditingId(null)} />
              ) : (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{item.product_name}</div>
                    {item.description && <div className="text-sm text-gray-600 italic mb-2">{item.description}</div>}
                    <div className="text-sm text-gray-600">
                      {item.quantity} {getStockUnitLabel(item.stock_unit)} in stock
                      {item.delivery_available && " • Delivery available"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-xl text-green-700">${item.price_per_unit}</div>
                      <div className="text-xs text-gray-500">{getSellingUnitLabel(item.selling_unit)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(item.id)}>
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No inventory items yet</p>
            <p className="text-sm">Add your first item to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
