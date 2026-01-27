"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, MapPin, Edit2, Package, Check, X, AlertCircle } from "lucide-react"
import type { Location, Inventory, StockUnit, SellingUnit, PricingOption } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HAY_TYPES } from "@/lib/hay-types"
import { getStockUnitLabel, getSellingUnitLabel } from "@/lib/unit-labels"
import { geocodeAddressClient, waitForGoogleMaps } from "@/lib/geocode-client"
import { InventoryItemEdit } from "@/components/inventory-item-edit"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LocationWithInventory extends Location {
  inventory: Inventory[]
}

interface LocationListProps {
  locations: LocationWithInventory[]
  supplierId: string
}

export function LocationList({ locations, supplierId }: LocationListProps) {
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set(locations.map((l) => l.id)))
  const [addingInventoryToLocation, setAddingInventoryToLocation] = useState<string | null>(null)
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null)

  // State for delete confirmation dialogs
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null)
  const [deleteInventoryId, setDeleteInventoryId] = useState<string | null>(null)
  const [deleteInventoryName, setDeleteInventoryName] = useState<string>("")

  // Location form state
  const [locationName, setLocationName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")

  const [editLocationName, setEditLocationName] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editCity, setEditCity] = useState("")
  const [editState, setEditState] = useState("")
  const [editZipCode, setEditZipCode] = useState("")

  // Inventory form state
  const [hayType, setHayType] = useState("")
  const [customHayType, setCustomHayType] = useState("")
  const [quantity, setQuantity] = useState("")
  const [stockUnit, setStockUnit] = useState<StockUnit>("tons")
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>([{ unit: "tons", price: 0 }])
  const [description, setDescription] = useState("")

  const [existingItems, setExistingItems] = useState<Set<string>>(new Set())

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const toggleLocation = (locationId: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev)
      if (next.has(locationId)) {
        next.delete(locationId)
      } else {
        next.add(locationId)
      }
      return next
    })
  }

  const resetLocationForm = () => {
    setLocationName("")
    setAddress("")
    setCity("")
    setState("")
    setZipCode("")
    setError(null)
  }

  const startEditingLocation = (location: LocationWithInventory) => {
    setEditingLocationId(location.id)
    setEditLocationName(location.name)
    setEditAddress(location.address)
    setEditCity(location.city)
    setEditState(location.state)
    setEditZipCode(location.zip_code || "")
    setError(null)
  }

  const cancelEditingLocation = () => {
    setEditingLocationId(null)
    setEditLocationName("")
    setEditAddress("")
    setEditCity("")
    setEditState("")
    setEditZipCode("")
    setError(null)
  }

  const handleUpdateLocation = async (e: React.FormEvent, locationId: string) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Geocode the address
      const mapsLoaded = await waitForGoogleMaps()
      if (!mapsLoaded) {
        setError("Google Maps is still loading. Please wait a moment and try again.")
        setIsLoading(false)
        return
      }

      const result = await geocodeAddressClient(editAddress, editCity, editState, editZipCode)

      if (!result.success) {
        setError("Unable to verify this address. Please check the address is correct.")
        setIsLoading(false)
        return
      }

      let finalAddress = editAddress
      let finalCity = editCity
      let finalState = editState
      let finalZipCode = editZipCode

      if (result.formattedAddress) {
        finalAddress = result.formattedAddress.street
        finalCity = result.formattedAddress.city
        finalState = result.formattedAddress.state
        finalZipCode = result.formattedAddress.zipCode
      }

      const { error } = await supabase
        .from("locations")
        .update({
          name: editLocationName || "Main Location",
          address: finalAddress,
          city: finalCity,
          state: finalState,
          zip_code: finalZipCode,
          latitude: result.latitude,
          longitude: result.longitude,
        })
        .eq("id", locationId)

      if (error) throw error

      cancelEditingLocation()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const resetInventoryForm = () => {
    setHayType("")
    setCustomHayType("")
    setQuantity("")
    setStockUnit("tons")
    setPricingOptions([{ unit: "tons", price: 0 }])
    setDescription("")
    setError(null)
  }

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Geocode the address
      const mapsLoaded = await waitForGoogleMaps()
      if (!mapsLoaded) {
        setError("Google Maps is still loading. Please wait a moment and try again.")
        setIsLoading(false)
        return
      }

      const result = await geocodeAddressClient(address, city, state, zipCode)

      if (!result.success) {
        setError("Unable to verify this address. Please check the address is correct.")
        setIsLoading(false)
        return
      }

      let finalAddress = address
      let finalCity = city
      let finalState = state
      let finalZipCode = zipCode

      if (result.formattedAddress) {
        finalAddress = result.formattedAddress.street
        finalCity = result.formattedAddress.city
        finalState = result.formattedAddress.state
        finalZipCode = result.formattedAddress.zipCode
      }

      const { error } = await supabase.from("locations").insert({
        supplier_id: supplierId,
        name: locationName || "Main Location",
        address: finalAddress,
        city: finalCity,
        state: finalState,
        zip_code: finalZipCode,
        latitude: result.latitude,
        longitude: result.longitude,
      })

      if (error) throw error

      resetLocationForm()
      setIsAddingLocation(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    setDeleteLocationId(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("locations").delete().eq("id", locationId)
      if (error) throw error
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const startAddingInventory = (locationId: string, location: LocationWithInventory) => {
    // Build set of existing product names in this location
    const existingProductNames = new Set(location.inventory.map((item) => item.product_name.toLowerCase()))
    setExistingItems(existingProductNames)
    setAddingInventoryToLocation(locationId)
    resetInventoryForm()
  }

  const addPricingOption = () => {
    setPricingOptions([...pricingOptions, { unit: "tons", price: 0 }])
  }

  const removePricingOption = (index: number) => {
    if (pricingOptions.length > 1) {
      setPricingOptions(pricingOptions.filter((_, i) => i !== index))
    }
  }

  const updatePricingOption = (index: number, field: keyof PricingOption, value: any) => {
    const newOptions = [...pricingOptions]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setPricingOptions(newOptions)
  }

  const handleAddInventory = async (e: React.FormEvent, locationId: string) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const finalProductName = hayType === "Other" ? customHayType : hayType

    const validPricingOptions = pricingOptions.filter((opt) => opt.price > 0)
    if (validPricingOptions.length === 0) {
      setError("Please add at least one pricing option with a valid price")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const defaultOption = validPricingOptions[0]

      const { error } = await supabase.from("inventory").insert({
        supplier_id: supplierId,
        location_id: locationId,
        product_name: finalProductName,
        quantity: Number.parseFloat(quantity),
        stock_unit: stockUnit,
        selling_unit: defaultOption.unit,
        price_per_unit: defaultOption.price,
        pricing_options: validPricingOptions,
        description: description || null,
      })

      if (error) throw error

      resetInventoryForm()
      setAddingInventoryToLocation(null)
      setExistingItems(new Set()) // Clear existing items after adding
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteInventory = async (inventoryId: string) => {
    setDeleteInventoryId(null)
    setDeleteInventoryName("")

    const supabase = createClient()

    try {
      const { error } = await supabase.from("inventory").delete().eq("id", inventoryId)
      if (error) throw error
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Locations & Inventory</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your farm locations and inventory items</p>
        </div>
        {!isAddingLocation && (
          <Button onClick={() => setIsAddingLocation(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            New Location
          </Button>
        )}
      </div>

      {isAddingLocation && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Add New Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddLocation} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="location-name">Location Name</Label>
                  <Input
                    id="location-name"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Main Farm, North Field, Warehouse"
                  />
                  <p className="text-xs text-muted-foreground">Optional - defaults to "Main Location"</p>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Farm Road"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Tucson"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="AZ"
                    required
                    maxLength={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="85701" />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingLocation(false)
                    resetLocationForm()
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Location"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {locations.length > 0 ? (
        <div className="grid gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="overflow-hidden">
              {editingLocationId === location.id ? (
                // Edit Location Form
                <div className="p-6 bg-muted/30">
                  <form onSubmit={(e) => handleUpdateLocation(e, location.id)} className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Edit Location</h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="edit-location-name">Location Name</Label>
                        <Input
                          id="edit-location-name"
                          value={editLocationName}
                          onChange={(e) => setEditLocationName(e.target.value)}
                          placeholder="e.g., Main Farm, North Field, Warehouse"
                        />
                      </div>

                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="edit-address">Street Address *</Label>
                        <Input
                          id="edit-address"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="123 Farm Road"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit-city">City *</Label>
                        <Input
                          id="edit-city"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="Tucson"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit-state">State *</Label>
                        <Input
                          id="edit-state"
                          value={editState}
                          onChange={(e) => setEditState(e.target.value)}
                          placeholder="AZ"
                          required
                          maxLength={2}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit-zip">ZIP Code</Label>
                        <Input
                          id="edit-zip"
                          value={editZipCode}
                          onChange={(e) => setEditZipCode(e.target.value)}
                          placeholder="85701"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={cancelEditingLocation} disabled={isLoading}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        <Check className="h-4 w-4 mr-2" />
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="bg-card">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{location.name}</h3>
                            <Badge variant="secondary" className="ml-2">
                              {location.inventory.length} {location.inventory.length === 1 ? "item" : "items"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {location.address}, {location.city}, {location.state} {location.zip_code}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditingLocation(location)}
                            title="Edit location"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteLocationId(location.id)}
                            title="Delete location"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4 space-y-2">
                      {location.inventory.length > 0 ? (
                        <div className="grid gap-2">
                          {location.inventory.map((item) =>
                            editingInventoryId === item.id ? (
                              <InventoryItemEdit
                                key={item.id}
                                item={item}
                                onCancel={() => setEditingInventoryId(null)}
                                onSave={() => {
                                  setEditingInventoryId(null)
                                  router.refresh()
                                }}
                              />
                            ) : (
                              <Card
                                key={item.id}
                                className="border bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-colors"
                              >
                                <CardContent className="p-2">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <Package className="h-5 w-5 text-primary flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline gap-2">
                                          <p className="font-medium text-base truncate">{item.product_name}</p>
                                          <Badge variant="secondary" className="flex-shrink-0 text-xs px-2 py-0.5">
                                            {item.quantity} {getStockUnitLabel(item.stock_unit)}
                                          </Badge>
                                        </div>
                                        {item.description && (
                                          <p className="text-sm text-muted-foreground italic mb-1">
                                            {item.description}
                                          </p>
                                        )}
                                        {item.pricing_options && item.pricing_options.length > 0 ? (
                                          <div className="space-y-0.5">
                                            {item.pricing_options.map((option, index) => (
                                              <p key={index} className="text-sm text-muted-foreground">
                                                ${option.price}/{getSellingUnitLabel(option.unit)}
                                              </p>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-muted-foreground">
                                            ${item.price_per_unit}/{getSellingUnitLabel(item.selling_unit)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEditingInventoryId(item.id)}
                                        title="Edit item"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                          setDeleteInventoryId(item.id)
                                          setDeleteInventoryName(item.product_name)
                                        }}
                                        title="Delete item"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ),
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">No inventory items at this location</p>
                        </div>
                      )}

                      {addingInventoryToLocation === location.id ? (
                        <Card className="border-2 border-primary/20 bg-primary/5">
                          <CardContent className="pt-6">
                            <form onSubmit={(e) => handleAddInventory(e, location.id)} className="space-y-4">
                              <div className="grid gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor={`hay-type-${location.id}`}>Hay Type *</Label>
                                  <Select
                                    value={hayType}
                                    onValueChange={(value) => {
                                      setHayType(value)
                                      if (value !== "Other") {
                                        setCustomHayType("")
                                      }
                                    }}
                                    required
                                  >
                                    <SelectTrigger id={`hay-type-${location.id}`}>
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
                                    <Label htmlFor={`custom-hay-${location.id}`}>Specify Hay Type *</Label>
                                    <Input
                                      id={`custom-hay-${location.id}`}
                                      value={customHayType}
                                      onChange={(e) => setCustomHayType(e.target.value)}
                                      placeholder="Enter hay type name"
                                      required
                                    />
                                  </div>
                                )}

                                {(hayType && hayType !== "Other" && existingItems.has(hayType.toLowerCase())) ||
                                (hayType === "Other" &&
                                  customHayType &&
                                  existingItems.has(customHayType.toLowerCase())) ? (
                                  <Alert variant="destructive" className="bg-yellow-50 border-yellow-200">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800">
                                      You already have this item type in this location. You can still add it, but
                                      consider editing the existing item instead.
                                    </AlertDescription>
                                  </Alert>
                                ) : null}

                                <div className="grid gap-2">
                                  <Label htmlFor={`description-${location.id}`}>Description (Optional)</Label>
                                  <Textarea
                                    id={`description-${location.id}`}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add details about quality, origin, storage conditions, etc."
                                    rows={2}
                                  />
                                </div>

                                <div className="border rounded-lg p-4 bg-gray-50">
                                  <h4 className="font-medium text-sm mb-3">Stock Information</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor={`quantity-${location.id}`}>Quantity in Stock *</Label>
                                      <Input
                                        id={`quantity-${location.id}`}
                                        type="number"
                                        step="0.01"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="0"
                                        required
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor={`stock-unit-${location.id}`}>Stock Unit *</Label>
                                      <Select
                                        value={stockUnit}
                                        onValueChange={(value: StockUnit) => setStockUnit(value)}
                                      >
                                        <SelectTrigger id={`stock-unit-${location.id}`}>
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
                                  <h4 className="font-medium text-sm mb-3">Pricing Options *</h4>
                                  <div className="space-y-3">
                                    {pricingOptions.map((option, index) => (
                                      <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                                        <div className="grid gap-1">
                                          <Label className="text-xs">Price $</Label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={option.price || ""}
                                            onChange={(e) =>
                                              updatePricingOption(
                                                index,
                                                "price",
                                                Number.parseFloat(e.target.value) || 0,
                                              )
                                            }
                                            placeholder="0.00"
                                            required
                                          />
                                        </div>
                                        <div className="grid gap-1">
                                          <Label className="text-xs">Per Unit</Label>
                                          <Select
                                            value={option.unit}
                                            onValueChange={(value: SellingUnit) =>
                                              updatePricingOption(index, "unit", value)
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="tons">Ton</SelectItem>
                                              <SelectItem value="large_bales">Large Bale</SelectItem>
                                              <SelectItem value="small_bales">Small Bale</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        {pricingOptions.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removePricingOption(index)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 space-y-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={addPricingOption}
                                      className="w-full h-8 bg-transparent"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Price
                                    </Button>
                                    <p className="text-xs text-muted-foreground">Multiple price options available</p>
                                  </div>
                                </div>
                              </div>

                              {error && (
                                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                                  <p className="text-sm text-destructive">{error}</p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingInventoryToLocation(null)
                                    setExistingItems(new Set()) // Clear existing items after cancelling
                                    resetInventoryForm()
                                  }}
                                  disabled={isLoading}
                                  className="flex-1 bg-transparent"
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
                      ) : (
                        <Button
                          onClick={() => startAddingInventory(location.id, location)}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Inventory Item
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first location to start listing inventory items
            </p>
            <Button onClick={() => setIsAddingLocation(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Location
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteLocationId !== null} onOpenChange={(open) => !open && setDeleteLocationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this location and all its inventory items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLocationId && handleDeleteLocation(deleteLocationId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteInventoryId !== null} onOpenChange={(open) => !open && setDeleteInventoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteInventoryName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInventoryId && handleDeleteInventory(deleteInventoryId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
