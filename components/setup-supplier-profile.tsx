"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { geocodeAddressClient, waitForGoogleMaps } from "@/lib/geocode-client"

interface SetupSupplierProfileProps {
  userId: string
}

export function SetupSupplierProfile({ userId }: SetupSupplierProfileProps) {
  const [businessName, setBusinessName] = useState("")
  const [supplierType, setSupplierType] = useState<"broker" | "grower">("grower")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [visibleToBuyers, setVisibleToBuyers] = useState(true)
  const [visibleToBrokers, setVisibleToBrokers] = useState(true)
  const [geocodedLat, setGeocodedLat] = useState<number | null>(null)
  const [geocodedLng, setGeocodedLng] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addressWarning, setAddressWarning] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setAddressWarning(null)

    const supabase = createClient()

    try {
      let latitude = null
      let longitude = null
      let finalAddress = address
      let finalCity = city
      let finalState = state
      let finalZipCode = zipCode

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

            // Update form fields with standardized address
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

      const { error } = await supabase.from("suppliers").insert({
        user_id: userId,
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
      })

      if (error) throw error

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Set Up Your Supplier Profile</CardTitle>
        <CardDescription>Complete your business profile to start listing inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input id="business-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="supplier-type">Supplier Type</Label>
            <Select value={supplierType} onValueChange={(value: "broker" | "grower") => setSupplierType(value)}>
              <SelectTrigger id="supplier-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grower">Grower</SelectItem>
                <SelectItem value="broker">Broker</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@business.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Business Location</h3>
            <p className="text-xs text-muted-foreground">
              You must provide a valid address to appear on the map. Your address will be verified when you create your
              profile.
            </p>

            <div className="grid gap-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Farm Road"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tucson" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="AZ"
                  required
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="85701"
                required
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Who do you want to see your offers?</h3>
            <p className="text-sm text-muted-foreground">Select who can view your inventory and contact you</p>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="buyers"
                  checked={visibleToBuyers}
                  onCheckedChange={(checked) => setVisibleToBuyers(checked === true)}
                />
                <Label htmlFor="buyers" className="text-sm font-normal cursor-pointer">
                  Buyers
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="brokers"
                  checked={visibleToBrokers}
                  onCheckedChange={(checked) => setVisibleToBrokers(checked === true)}
                />
                <Label htmlFor="brokers" className="text-sm font-normal cursor-pointer">
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Profile..." : "Create Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
