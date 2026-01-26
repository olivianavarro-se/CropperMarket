"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Package, CheckCircle } from "lucide-react"
import type { LocationWithSupplier, Inventory } from "@/lib/types"
import { getSellingUnitLabel } from "@/lib/unit-labels"

interface ContactSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: LocationWithSupplier
  userId: string
}

interface SelectedItem {
  inventoryId: string
  quantity: number
  pricingOptionIndex?: number
}

export function ContactSupplierDialog({
  open,
  onOpenChange,
  location,
  userId,
}: ContactSupplierDialogProps) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleItemToggle = (inventoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, { inventoryId, quantity: 1 }])
    } else {
      setSelectedItems(selectedItems.filter((item) => item.inventoryId !== inventoryId))
    }
  }

  const handleQuantityChange = (inventoryId: string, quantity: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.inventoryId === inventoryId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    )
  }

  const handlePricingOptionChange = (inventoryId: string, pricingOptionIndex: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.inventoryId === inventoryId ? { ...item, pricingOptionIndex } : item
      )
    )
  }

  const isItemSelected = (inventoryId: string) => {
    return selectedItems.some((item) => item.inventoryId === inventoryId)
  }

  const getSelectedItem = (inventoryId: string) => {
    return selectedItems.find((item) => item.inventoryId === inventoryId)
  }

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one item to request")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Build requested items array with inventory details
      const requestedItems = selectedItems.map((selected) => {
        const inventory = location.inventory.find((inv) => inv.id === selected.inventoryId)
        if (!inventory) return null

        const pricingOption =
          inventory.pricing_options && inventory.pricing_options.length > 0
            ? inventory.pricing_options[selected.pricingOptionIndex || 0]
            : { unit: inventory.selling_unit, price: inventory.price_per_unit }

        return {
          inventory_id: selected.inventoryId,
          product_name: inventory.product_name,
          quantity: selected.quantity,
          unit: pricingOption.unit,
          price_per_unit: pricingOption.price,
        }
      }).filter(Boolean)

      // Insert order request
      const { error: insertError } = await supabase.from("order_requests").insert({
        requester_id: userId,
        supplier_id: location.supplier.id,
        location_id: location.id,
        requested_items: requestedItems,
        message: message || null,
        status: "pending",
      })

      if (insertError) {
        console.error("[Location] Order request error:", insertError)
        setError("Failed to submit request. Please try again.")
        return
      }

      setIsSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        // Reset form state after closing
        setTimeout(() => {
          setSelectedItems([])
          setMessage("")
          setIsSuccess(false)
        }, 300)
      }, 2000)
    } catch (err) {
      console.error("[Location] Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Sent!</h3>
            <p className="text-gray-600">
              Your request has been sent to {location.supplier.business_name}. You can track the status in your Orders tab.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Inventory</DialogTitle>
          <DialogDescription>
            Select the items you'd like to request from {location.supplier.business_name} at {location.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Available Inventory
            </Label>

            {location.inventory.length > 0 ? (
              <div className="space-y-3">
                {location.inventory.map((item) => {
                  const isSelected = isItemSelected(item.id)
                  const selectedItem = getSelectedItem(item.id)
                  const hasPricingOptions = item.pricing_options && item.pricing_options.length > 0

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isSelected ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleItemToggle(item.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`item-${item.id}`}
                            className="font-medium text-sm cursor-pointer"
                          >
                            {item.product_name}
                          </label>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                          )}
                          <div className="text-xs text-gray-600 mt-1">
                            {item.quantity} available
                            {item.delivery_available && " • Delivery available"}
                          </div>

                          {hasPricingOptions ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.pricing_options.map((option, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    if (!isSelected) {
                                      setSelectedItems([
                                        ...selectedItems,
                                        { inventoryId: item.id, quantity: 1, pricingOptionIndex: idx },
                                      ])
                                    } else {
                                      handlePricingOptionChange(item.id, idx)
                                    }
                                  }}
                                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                                    isSelected && (selectedItem?.pricingOptionIndex === idx || (selectedItem?.pricingOptionIndex === undefined && idx === 0))
                                      ? "bg-green-600 text-white border-green-600"
                                      : "bg-white text-gray-700 border-gray-300 hover:border-green-500"
                                  }`}
                                >
                                  ${option.price}/{getSellingUnitLabel(option.unit)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-green-700 font-medium mt-1">
                              ${item.price_per_unit}/{getSellingUnitLabel(item.selling_unit || "tons")}
                            </div>
                          )}

                          {isSelected && (
                            <div className="mt-2 flex items-center gap-2">
                              <Label htmlFor={`qty-${item.id}`} className="text-xs">
                                Quantity:
                              </Label>
                              <Input
                                id={`qty-${item.id}`}
                                type="number"
                                min="1"
                                value={selectedItem?.quantity || 1}
                                onChange={(e) =>
                                  handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                                }
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No inventory available at this location</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add any additional details or questions for the supplier..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedItems.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              `Send Request (${selectedItems.length} item${selectedItems.length !== 1 ? "s" : ""})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
