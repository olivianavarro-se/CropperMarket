"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Edit2, Save, X, Mail } from "lucide-react"
import type { Supplier } from "@/lib/types"
import { geocodeAddressClient, waitForGoogleMaps } from "@/lib/geocode-client"

interface SupplierProfileProps {
  supplier: Supplier
  userId: string
}

export function SupplierProfile({ supplier, userId }: SupplierProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [businessName, setBusinessName] = useState(supplier.business_name)
  const [supplierType, setSupplierType] = useState(supplier.supplier_type)
  const [description, setDescription] = useState(supplier.description || "")
  const [email, setEmail] = useState(supplier.email || "")
  const [phone, setPhone] = useState(supplier.phone || "")
  const [address, setAddress] = useState(supplier.address || "")
  const [city, setCity] = useState(supplier.city || "")
  const [state, setState] = useState(supplier.state || "")
  const [zipCode, setZipCode] = useState(supplier.zip_code || "")
  const [visibleToBuyers, setVisibleToBuyers] = useState(supplier.visible_to_buyers)
  const [visibleToBrokers, setVisibleToBrokers] = useState(supplier.visible_to_brokers)
  const [geocodedLat, setGeocodedLat] = useState<number | null>(null)
  const [geocodedLng, setGeocodedLng] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addressWarning, setAddressWarning] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)
    setAddressWarning(null)

    const supabase = createClient()

    try {
      let latitude = supplier.latitude
      let longitude = supplier.longitude
      let finalAddress = address
      let finalCity = city
      let finalState = state
      let finalZipCode = zipCode

      console.log("[v0] Starting save with address:", { address, city, state, zipCode })

      const hasAnyAddress = address || city || state || zipCode
      const hasAllRequiredAddress = address && city && state

      if (hasAnyAddress && !hasAllRequiredAddress) {
        setError("Please provide complete address information (Street Address, City, and State) to appear on the map.")
        setIsLoading(false)
        return
      }

      if (address && city && state) {
        console.log("[v0] Attempting geocoding for address...")
        const mapsLoaded = await waitForGoogleMaps()

        if (!mapsLoaded) {
          setError("Google Maps is still loading. Please wait a moment and try again.")
          setIsLoading(false)
          return
        }

        const result = await geocodeAddressClient(address, city, state, zipCode)
        console.log("[v0] Geocoding result:", result)

        if (result.success) {
          latitude = result.latitude
          longitude = result.longitude

          if (result.formattedAddress) {
            finalAddress = result.formattedAddress.street
            finalCity = result.formattedAddress.city
            finalState = result.formattedAddress.state
            finalZipCode = result.formattedAddress.zipCode

            setAddress(finalAddress)
            setCity(finalCity)
            setState(finalState)
            setZipCode(finalZipCode)

            console.log("[v0] Address standardized to:", result.formattedAddress)
          }

          console.log("[v0] Address verified successfully:", { latitude, longitude })
        } else {
          setError(
            "Unable to verify this address. Please check that the street address, city, state, and ZIP code are correct. You must provide a valid address to appear on the map.",
          )
          setIsLoading(false)
          return
        }
      }

      console.log("[v0] Updating supplier with coordinates:", { latitude, longitude })

      const { error } = await supabase
        .from("suppliers")
        .update({
          business_name: businessName,
          supplier_type: supplierType,
          description: description || null,
          email: email || null,
          phone: phone || null,
          address: finalAddress || null,
          city: finalCity || null,
          state: finalState || null,
          zip_code: finalZipCode || null,
          latitude,
          longitude,
          visible_to_buyers: visibleToBuyers,
          visible_to_brokers: visibleToBrokers,
          updated_at: new Date().toISOString(),
        })
        .eq("id", supplier.id)

      if (error) {
        console.error("[v0] Supabase update error:", error)
        throw error
      }

      console.log("[v0] Supplier updated successfully")

      setIsEditing(false)
      router.refresh()
    } catch (err: unknown) {
      console.error("[v0] Save error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setBusinessName(supplier.business_name)
    setSupplierType(supplier.supplier_type)
    setDescription(supplier.description || "")
    setEmail(supplier.email || "")
    setPhone(supplier.phone || "")
    setAddress(supplier.address || "")
    setCity(supplier.city || "")
    setState(supplier.state || "")
    setZipCode(supplier.zip_code || "")
    setVisibleToBuyers(supplier.visible_to_buyers)
    setVisibleToBrokers(supplier.visible_to_brokers)
    setGeocodedLat(null)
    setGeocodedLng(null)
    setIsEditing(false)
    setError(null)
    setAddressWarning(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Business Profile</CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="edit-business-name">Business Name</Label>
              <Input id="edit-business-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-supplier-type">Supplier Type</Label>
              <Select value={supplierType} onValueChange={(value: "broker" | "grower") => setSupplierType(value)}>
                <SelectTrigger id="edit-supplier-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grower">Grower</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-email">Contact Email</Label>
              <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Business Location</h3>
              <p className="text-xs text-muted-foreground">
                You must provide a valid address to appear on the map. Your address will be verified when you save.
              </p>

              <div className="grid gap-2">
                <Label htmlFor="edit-address">Street Address</Label>
                <Input id="edit-address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input id="edit-city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input id="edit-state" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-zip">ZIP Code</Label>
                <Input id="edit-zip" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Who do you want to see your offers?</h3>
              <p className="text-sm text-muted-foreground">Select who can view your inventory and contact you</p>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-buyers"
                    checked={visibleToBuyers}
                    onCheckedChange={(checked) => setVisibleToBuyers(checked === true)}
                  />
                  <Label htmlFor="edit-buyers" className="text-sm font-normal cursor-pointer">
                    Buyers
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-brokers"
                    checked={visibleToBrokers}
                    onCheckedChange={(checked) => setVisibleToBrokers(checked === true)}
                  />
                  <Label htmlFor="edit-brokers" className="text-sm font-normal cursor-pointer">
                    Brokers
                  </Label>
                </div>
              </div>
            </div>

            {addressWarning && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">{addressWarning}</p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <h3 className="text-2xl font-bold mb-2">{supplier.business_name}</h3>
              <Badge variant={supplier.supplier_type === "broker" ? "default" : "secondary"}>
                {supplier.supplier_type === "broker" ? "Broker" : "Grower"}
              </Badge>
            </div>

            {supplier.description && <p className="text-sm text-gray-600">{supplier.description}</p>}

            <div className="space-y-2">
              {supplier.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {(supplier.address || supplier.city) && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <div>
                    {supplier.address && <div>{supplier.address}</div>}
                    {(supplier.city || supplier.state || supplier.zip_code) && (
                      <div>
                        {supplier.city}
                        {supplier.state && `, ${supplier.state}`}
                        {supplier.zip_code && ` ${supplier.zip_code}`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Offer Visibility</h4>
              <div className="flex gap-2">
                {supplier.visible_to_buyers && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Visible to Buyers
                  </Badge>
                )}
                {supplier.visible_to_brokers && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Visible to Brokers
                  </Badge>
                )}
                {!supplier.visible_to_buyers && !supplier.visible_to_brokers && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    Not Visible
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
