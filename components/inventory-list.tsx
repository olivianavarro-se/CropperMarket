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
import type { Inventory } from "@/lib/types"
import { InventoryItemEdit } from "@/components/inventory-item-edit"

interface InventoryListProps {
  inventory: Inventory[]
  supplierId: string
}

export function InventoryList({ inventory, supplierId }: InventoryListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [productName, setProductName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState<"tons" | "bales">("tons")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [deliveryAvailable, setDeliveryAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("inventory").insert({
        supplier_id: supplierId,
        product_name: productName,
        quantity: Number.parseFloat(quantity),
        unit,
        price_per_unit: Number.parseFloat(pricePerUnit),
        delivery_available: deliveryAvailable,
      })

      if (error) throw error

      // Reset form
      setProductName("")
      setQuantity("")
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
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g., Alfalfa Hay"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
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
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={unit} onValueChange={(value: "tons" | "bales") => setUnit(value)}>
                      <SelectTrigger id="unit">
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
                  <Label htmlFor="price">Price per Unit</Label>
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
                    <div className="text-sm text-gray-600">
                      {item.quantity} {item.unit}
                      {item.delivery_available && " • Delivery available"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-xl text-green-700">${item.price_per_unit}</div>
                      <div className="text-xs text-gray-500">per {item.unit === "tons" ? "ton" : "bale"}</div>
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
