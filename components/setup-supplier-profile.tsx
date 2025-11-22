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
import { geocodeAddress } from "@/app/actions/geocode"

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let latitude = null
      let longitude = null

      if (address && city && state) {
        const result = await geocodeAddress(address, city, state, zipCode)
        if (result.success) {
          latitude = result.latitude
          longitude = result.longitude
        }
      }

      const { error } = await supabase.from("suppliers").insert({
        user_id: userId,
        business_name: businessName,
        supplier_type: supplierType,
        description: description || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip_code: zipCode || null,
        latitude,
        longitude,
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
                <SelectItem value="grower">Grower (Grow Only)</SelectItem>
                <SelectItem value="broker">Broker (Grow + Deliver)</SelectItem>
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Profile..." : "Create Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
