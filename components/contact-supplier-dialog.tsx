"use client"

import { useState, useEffect } from "react"
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
  quantity: number | null
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

  // Reset all state whenever the dialog opens
  useEffect(() => {
    if (open) {
      setSelectedItems([])
      setMessage("")
      setIsSuccess(false)
      setError(null)
    }
  }, [open])

  const handleItemToggle = (inventoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, { inventoryId, quantity: null }])
    } else {
      setSelectedItems(selectedItems.filter((item) => item.inventoryId !== inventoryId))
    }
  }

  const handleQuantityChange = (inventoryId: string, quantity: number | null, maxAvailable: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.inventoryId === inventoryId 
          ? { ...item, quantity: quantity === null ? null : Math.min(quantity, maxAvailable) } 
          : item
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

  const calculateTotal = () => {
    return selectedItems.reduce((total, selected) => {
      const inventory = location.inventory.find((inv) => inv.id === selected.inventoryId)
      if (!inventory || !selected.quantity) return total

      const pricingOption =
        inventory.pricing_options && inventory.pricing_options.length > 0
          ? inventory.pricing_options[selected.pricingOptionIndex || 0]
          : { unit: inventory.selling_unit, price: inventory.price_per_unit }

      return total + pricingOption.price * selected.quantity
    }, 0)
  }

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one item")
      return
    }

    // Validate all selected items have valid quantities
    const invalidItems = selectedItems.filter(item => !item.quantity || item.quantity < 1)
    if (invalidItems.length > 0) {
      setError("Please enter a valid quantity for all selected items")
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
    } catch (err) {
      console.error("[Location] Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSuccess = () => {
    onOpenChange(false)
    // Reset form state after closing
    setTimeout(() => {
      setSelectedItems([])
      setMessage("")
      setIsSuccess(false)
    }, 300)
  }

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleCloseSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Sent!</h3>
            <p className="text-gray-600 mb-6">
              Your request has been sent to {location.supplier.business_name}. You can track the status in your Orders tab.
            </p>
            <Button onClick={handleCloseSuccess}>Close</Button>
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Enter qty"
                                value={selectedItem?.quantity === null ? '' : selectedItem?.quantity}
                                onChange={(e) => {
                                  const value = e.target.value
                                  // Allow empty field during typing
                                  if (value === '') {
                                    handleQuantityChange(item.id, null, item.quantity)
                                    return
                                  }
                                  const numValue = parseInt(value)
                                  if (!isNaN(numValue) && numValue > 0) {
                                    handleQuantityChange(item.id, numValue, item.quantity)
                                  }
                                }}
                                onBlur={(e) => {
                                  // If field is empty on blur, set to 1
                                  if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                    handleQuantityChange(item.id, 1, item.quantity)
                                  }
                                }}
                                className="w-20 h-8 text-sm"
                              />
                              <span className="text-xs text-gray-500">
                                (max: {item.quantity})
                              </span>
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

          {selectedItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Estimated Total Cost:</span>
                <span className="text-lg font-semibold text-blue-600">${calculateTotal().toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                This is an estimate based on {selectedItems.length} selected item{selectedItems.length !== 1 ? "s" : ""} and current pricing.
              </p>
            </div>
          )}

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
