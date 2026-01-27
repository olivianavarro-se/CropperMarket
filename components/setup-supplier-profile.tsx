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

interface SetupSupplierProfileProps {
  userId: string
}

export function SetupSupplierProfile({ userId }: SetupSupplierProfileProps) {
  const [businessName, setBusinessName] = useState("")
  const [supplierType, setSupplierType] = useState<"broker" | "grower">("grower")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [visibleToBuyers, setVisibleToBuyers] = useState(true)
  const [visibleToBrokers, setVisibleToBrokers] = useState(true)
  const [deliveryAvailable, setDeliveryAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("suppliers").insert({
        user_id: userId,
        business_name: businessName,
        supplier_type: supplierType,
        description: description || null,
        email: email || null,
        phone: phone || null,
        visible_to_buyers: visibleToBuyers,
        visible_to_brokers: visibleToBrokers,
        delivery_available: deliveryAvailable,
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
        <CardDescription>
          Complete your business profile to start listing inventory. You'll add your location when creating inventory.
        </CardDescription>
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

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Delivery Options</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delivery"
                checked={deliveryAvailable}
                onCheckedChange={(checked) => setDeliveryAvailable(checked === true)}
              />
              <Label htmlFor="delivery" className="text-sm font-normal cursor-pointer">
                I offer delivery
              </Label>
            </div>
          </div>

          <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
            <p className="text-sm text-blue-800">
              After creating your profile, you'll be able to add locations and inventory. Each location can have its own
              address and inventory items.
            </p>
          </div>

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
