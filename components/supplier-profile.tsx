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
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Edit2, Save, X, Mail } from "lucide-react"
import type { Supplier } from "@/lib/types"
import { geocodeAddress } from "@/app/actions/geocode"

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let latitude = supplier.latitude
      let longitude = supplier.longitude

      if (address && city && state) {
        const result = await geocodeAddress(address, city, state, zipCode)
        if (result.success) {
          latitude = result.latitude
          longitude = result.longitude
        }
      }

      const { error } = await supabase
        .from("suppliers")
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", supplier.id)

      if (error) throw error

      setIsEditing(false)
      router.refresh()
    } catch (err: unknown) {
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
    setIsEditing(false)
    setError(null)
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

            {error && <p className="text-sm text-red-500">{error}</p>}
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
