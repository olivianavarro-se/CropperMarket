"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Phone, Edit2, Save, X, Mail, Truck, Upload, ImageIcon } from "lucide-react"
import type { Supplier } from "@/lib/types"
import { PickupHoursEditor, PickupHoursDisplay } from "@/components/pickup-hours-editor"

interface SupplierProfileProps {
  supplier: Supplier
  userId: string
}

export function SupplierProfile({ supplier, userId }: SupplierProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [businessName, setBusinessName] = useState(supplier.business_name)
  const [supplierType, setSupplierType] = useState(supplier.supplier_type)
  const [email, setEmail] = useState(supplier.email || "")
  const [phone, setPhone] = useState(supplier.phone || "")
  const [visibleToBuyers, setVisibleToBuyers] = useState(supplier.visible_to_buyers)
  const [visibleToBrokers, setVisibleToBrokers] = useState(supplier.visible_to_brokers)
  const [paymentMethods, setPaymentMethods] = useState<string[]>(supplier.payment_methods || [])
  const [pickupHours, setPickupHours] = useState(supplier.pickup_hours || [])
  const [logoUrl, setLogoUrl] = useState(supplier.logo_url || "")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file")
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Image must be less than 2MB")
        return
      }

      setLogoFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("suppliers")
        .update({
          business_name: businessName,
          supplier_type: supplierType,
          email: email || null,
          phone: phone || null,
          visible_to_buyers: visibleToBuyers,
          visible_to_brokers: visibleToBrokers,
          payment_methods: paymentMethods,
          pickup_hours: pickupHours,
          logo_url: logoUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", supplier.id)

      if (error) {
        console.error("[v0] Supabase update error:", error)
        throw error
      }

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
    setEmail(supplier.email || "")
    setPhone(supplier.phone || "")
    setVisibleToBuyers(supplier.visible_to_buyers)
    setVisibleToBrokers(supplier.visible_to_brokers)
    setPaymentMethods(supplier.payment_methods || [])
    setPickupHours(supplier.pickup_hours || [])
    setLogoUrl(supplier.logo_url || "")
    setLogoFile(null)
    setIsEditing(false)
    setError(null)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {supplier.logo_url && (
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={supplier.logo_url || "/placeholder.svg"}
                  alt={`${supplier.business_name} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-xl">Business Profile</CardTitle>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-primary">{supplier.business_name}</h3>
                <Badge 
                  variant="outline"
                  className={
                    supplier.supplier_type === "broker" 
                      ? "bg-yellow-50 border-yellow-200 text-yellow-800 text-xs" 
                      : "bg-green-50 border-green-200 text-green-800 text-xs"
                  }
                >
                  {supplier.supplier_type === "broker" ? "Broker" : "Grower"}
                </Badge>
              </div>
            </div>
          </div>
          <div>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        {isEditing ? (
          <>
            <div className="grid gap-3 pb-3 border-b">
              <Label className="text-sm font-semibold">Business Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  {logoUrl ? (
                    <img
                      src={logoUrl || "/placeholder.svg"}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-business-name" className="text-sm">
                  Business Name
                </Label>
                <Input
                  id="edit-business-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-supplier-type" className="text-sm">
                  Supplier Type
                </Label>
                <Select value={supplierType} onValueChange={(value: "broker" | "grower") => setSupplierType(value)}>
                  <SelectTrigger id="edit-supplier-type" className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grower">Grower</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-email" className="text-sm">
                  Contact Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-phone" className="text-sm">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="border-t pt-3 space-y-3">
              <div>
                <h3 className="font-semibold text-sm mb-1.5">Offer Visibility</h3>
                <div className="flex gap-4">
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

              <div>
                <h3 className="font-semibold text-sm mb-2">Accepted Payment Methods</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: "cash", label: "Cash" },
                    { value: "credit", label: "Credit Card" },
                    { value: "debit", label: "Debit Card" },
                    { value: "zelle", label: "Zelle" },
                    { value: "venmo", label: "Venmo" },
                    { value: "check", label: "Check" },
                    { value: "apple_pay", label: "Apple Pay" },
                  ].map((method) => (
                    <div key={method.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`payment-${method.value}`}
                        checked={paymentMethods.includes(method.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPaymentMethods([...paymentMethods, method.value])
                          } else {
                            setPaymentMethods(paymentMethods.filter((m) => m !== method.value))
                          }
                        }}
                      />
                      <Label htmlFor={`payment-${method.value}`} className="text-sm font-normal cursor-pointer">
                        {method.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <PickupHoursEditor schedules={pickupHours} onChange={setPickupHours} />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-2">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {supplier.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.phone}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-2 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Visibility</h4>
                <div className="flex flex-wrap gap-1.5">
                  {supplier.visible_to_buyers && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      Visible to Buyers
                    </Badge>
                  )}
                  {supplier.visible_to_brokers && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      Visible to Brokers
                    </Badge>
                  )}
                  {!supplier.visible_to_buyers && !supplier.visible_to_brokers && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                      Not Visible
                    </Badge>
                  )}
                </div>
              </div>

              {supplier.payment_methods && supplier.payment_methods.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Accepted Payment Methods</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {supplier.payment_methods.map((method) => {
                      const methodLabels: Record<string, string> = {
                        cash: "Cash",
                        credit: "Credit Card",
                        debit: "Debit Card",
                        zelle: "Zelle",
                        venmo: "Venmo",
                        check: "Check",
                        apple_pay: "Apple Pay",
                      }
                      return (
                        <Badge key={method} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          {methodLabels[method] || method}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              {supplier.pickup_hours && supplier.pickup_hours.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pickup Hours</h4>
                  <PickupHoursDisplay schedules={supplier.pickup_hours} />
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
