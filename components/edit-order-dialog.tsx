"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { getUnitLabel } from "@/lib/unit-labels"

export interface EditableOrderItem {
  inventory_id: string
  product_name: string
  quantity: number
  unit: string
  price_per_unit: number
}

interface PricingOption {
  unit: string
  price: number
}

interface InventoryRow {
  id: string
  product_name: string
  quantity: number
  stock_unit: string
  selling_unit: string | null
  price_per_unit: number
  pricing_options: PricingOption[] | null
}

interface EditOrderDialogProps {
  orderId: string
  supplierId: string
  items: EditableOrderItem[]
  onSaved: (items: EditableOrderItem[]) => void
}

function getOptions(row: InventoryRow): PricingOption[] {
  if (row.pricing_options && row.pricing_options.length > 0) return row.pricing_options
  return [{ unit: row.selling_unit || row.stock_unit, price: Number(row.price_per_unit) }]
}

export function EditOrderDialog({ orderId, supplierId, items, onSaved }: EditOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<EditableOrderItem[]>(items)
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newItemId, setNewItemId] = useState("")
  const [newOptionIndex, setNewOptionIndex] = useState("0")
  const [newQuantity, setNewQuantity] = useState("1")

  const supabase = createClient()

  const loadInventory = async () => {
    setLoadingInventory(true)
    const { data, error: loadError } = await supabase
      .from("inventory")
      .select("id, product_name, quantity, stock_unit, selling_unit, price_per_unit, pricing_options")
      .eq("supplier_id", supplierId)
      .order("product_name")
    if (loadError) setError("Could not load your inventory.")
    setInventory((data as InventoryRow[]) || [])
    setLoadingInventory(false)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setDraft(items.map((item) => ({ ...item })))
      setError(null)
      setNewItemId("")
      setNewOptionIndex("0")
      setNewQuantity("1")
      loadInventory()
    }
  }

  const updateQuantity = (index: number, value: string) => {
    const quantity = Number(value)
    setDraft((prev) => prev.map((item, i) => (i === index ? { ...item, quantity } : item)))
  }

  const removeItem = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const selectedRow = inventory.find((row) => row.id === newItemId)
  const selectedOptions = selectedRow ? getOptions(selectedRow) : []

  const addItem = () => {
    if (!selectedRow) return
    const option = selectedOptions[Number(newOptionIndex)] || selectedOptions[0]
    const quantity = Number(newQuantity)
    if (!option || !Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a quantity greater than zero.")
      return
    }
    setError(null)
    setDraft((prev) => {
      const existing = prev.findIndex((item) => item.inventory_id === selectedRow.id && item.unit === option.unit)
      if (existing >= 0) {
        return prev.map((item, i) => (i === existing ? { ...item, quantity: item.quantity + quantity } : item))
      }
      return [
        ...prev,
        {
          inventory_id: selectedRow.id,
          product_name: selectedRow.product_name,
          quantity,
          unit: option.unit,
          price_per_unit: Number(option.price),
        },
      ]
    })
    setNewItemId("")
    setNewOptionIndex("0")
    setNewQuantity("1")
  }

  const pendingOption = selectedRow ? selectedOptions[Number(newOptionIndex)] || selectedOptions[0] : undefined
  const pendingQuantity = Number(newQuantity)
  const pendingSubtotal =
    pendingOption && Number.isFinite(pendingQuantity) && pendingQuantity > 0
      ? Number(pendingOption.price) * pendingQuantity
      : 0
  const itemsTotal = draft.reduce(
    (sum, item) => sum + item.price_per_unit * (Number.isFinite(item.quantity) ? item.quantity : 0),
    0,
  )
  const total = itemsTotal + pendingSubtotal

  const save = async () => {
    if (draft.length === 0) {
      setError("An order needs at least one item. Reject or delete the order instead.")
      return
    }
    if (draft.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
      setError("Every quantity must be greater than zero.")
      return
    }
    setSaving(true)
    setError(null)
    const { error: saveError } = await supabase
      .from("order_requests")
      .update({ requested_items: draft, updated_at: new Date().toISOString() })
      .eq("id", orderId)
    setSaving(false)
    if (saveError) {
      setError(saveError.message || "Could not save the changes.")
      return
    }
    onSaved(draft)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 bg-transparent">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>
            Change quantities, remove items, or add more from your inventory. Stock is updated when the order is
            marked as completed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {draft.map((item, index) => (
            <div key={`${item.inventory_id}-${item.unit}`} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{item.product_name}</span>
                <span className="text-xs text-muted-foreground">
                  ${item.price_per_unit}/{getUnitLabel(item.unit)}
                </span>
              </div>
              <Label htmlFor={`qty-${index}`} className="sr-only">
                Quantity for {item.product_name}
              </Label>
              <Input
                id={`qty-${index}`}
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={Number.isFinite(item.quantity) ? item.quantity : ""}
                onChange={(e) => updateQuantity(index, e.target.value)}
                className="w-24"
              />
              <span className="w-20 text-right text-sm font-semibold tabular-nums">
                ${(item.price_per_unit * (Number.isFinite(item.quantity) ? item.quantity : 0)).toFixed(2)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${item.product_name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {draft.length === 0 && (
            <p className="text-sm text-muted-foreground">No items left in this order.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-3">
          <span className="text-sm font-medium">Add an item</span>
          {loadingInventory ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading inventory
            </div>
          ) : (
            <>
              <Select
                value={newItemId}
                onValueChange={(value) => {
                  setNewItemId(value)
                  setNewOptionIndex("0")
                }}
              >
                <SelectTrigger aria-label="Product">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.product_name} ({row.quantity} {getUnitLabel(row.stock_unit)} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRow && (
                <div className="flex gap-2">
                  <Select value={newOptionIndex} onValueChange={setNewOptionIndex}>
                    <SelectTrigger aria-label="Unit" className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedOptions.map((option, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          ${option.price}/{getUnitLabel(option.unit)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    aria-label="Quantity to add"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-24"
                  />
                  <Button type="button" variant="secondary" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-1 text-sm" aria-live="polite">
          {pendingSubtotal > 0 && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Includes item not yet added</span>
              <span className="tabular-nums">+${pendingSubtotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">New total</span>
            <span className="text-base font-semibold tabular-nums">${total.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="bg-transparent">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
