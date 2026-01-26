"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, User, Mail, Phone, MapPin, MessageSquare, Clock, Check, X, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface RequestedItem {
  inventory_id: string
  product_name: string
  quantity: number
  unit: string
  price_per_unit: number
}

interface OrderRequest {
  id: string
  requester_id: string
  supplier_id: string
  location_id: string
  requested_items: RequestedItem[]
  message: string | null
  status: "pending" | "accepted" | "rejected" | "completed"
  created_at: string
  updated_at: string
  requester: {
    full_name: string | null
    email: string
    phone: string | null
  }
  location: {
    name: string
    city: string
    state: string
  }
}

interface SupplierOrdersProps {
  supplierId: string
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
}

const statusLabels = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  completed: "Completed",
}

export function SupplierOrders({ supplierId }: SupplierOrdersProps) {
  const [orders, setOrders] = useState<OrderRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected" | "completed">("all")

  const supabase = createClient()

  const fetchOrders = async () => {
    setLoading(true)
    try {
      // Fetch orders first
      const { data: ordersData, error: ordersError } = await supabase
        .from("order_requests")
        .select(`
          *,
          location:locations (
            name,
            city,
            state
          )
        `)
        .eq("supplier_id", supplierId)
        .order("created_at", { ascending: false })

      if (ordersError) {
        console.error("[Orders] Error fetching orders:", ordersError.message)
        return
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        return
      }

      // Get unique requester IDs
      const requesterIds = [...new Set(ordersData.map((o) => o.requester_id))]

      // Fetch requester profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", requesterIds)

      if (profilesError) {
        console.error("[Orders] Error fetching profiles:", profilesError.message)
      }

      // Create profiles map
      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.id, { full_name: p.full_name, email: p.email, phone: p.phone }])
      )

      // Combine orders with requester info
      const ordersWithRequesters = ordersData.map((order) => ({
        ...order,
        requester: profilesMap.get(order.requester_id) || { full_name: null, email: "Unknown", phone: null },
      }))

      setOrders(ordersWithRequesters)
    } catch (err) {
      console.error("[Orders] Unexpected error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [supplierId])

  const updateOrderStatus = async (orderId: string, newStatus: "accepted" | "rejected" | "completed") => {
    setUpdating(orderId)
    try {
      const { error } = await supabase
        .from("order_requests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (error) {
        console.error("[Orders] Error updating status:", error)
        return
      }

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
    } finally {
      setUpdating(null)
    }
  }

  const filteredOrders = filter === "all" ? orders : orders.filter((order) => order.status === filter)

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case "tons":
        return "Ton"
      case "small_bales":
        return "Small Bale"
      case "large_bales":
        return "Large Bale"
      default:
        return unit
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Incoming Orders</h2>
          <p className="text-sm text-muted-foreground">
            Manage inventory requests from buyers
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="bg-transparent">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "accepted", "rejected", "completed"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
            className={filter !== status ? "bg-transparent" : ""}
          >
            {status === "all" ? "All" : statusLabels[status]}
            {status !== "all" && (
              <span className="ml-2 text-xs">
                ({orders.filter((o) => o.status === status).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
            <p className="text-muted-foreground">
              {filter === "all"
                ? "When buyers request your inventory, their orders will appear here."
                : `No ${filter} orders found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">
                        Order Request
                      </CardTitle>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {order.location?.name} - {order.location?.city}, {order.location?.state}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Customer Info */}
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{order.requester?.full_name || "No name provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${order.requester?.email}`} className="text-primary hover:underline">
                        {order.requester?.email}
                      </a>
                    </div>
                    {order.requester?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${order.requester.phone}`} className="text-primary hover:underline">
                          {order.requester.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requested Items */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Requested Items
                  </h4>
                  <div className="space-y-2">
                    {order.requested_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-muted-foreground ml-2">
                            x {item.quantity} {getUnitLabel(item.unit)}{item.quantity > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-700">
                            ${(item.price_per_unit * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${item.price_per_unit}/{getUnitLabel(item.unit)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message */}
                {order.message && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-blue-900">
                      <MessageSquare className="h-4 w-4" />
                      Customer Message
                    </h4>
                    <p className="text-sm text-blue-800">{order.message}</p>
                  </div>
                )}

                {/* Actions */}
                {order.status === "pending" && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      onClick={() => updateOrderStatus(order.id, "accepted")}
                      disabled={updating === order.id}
                      className="flex-1"
                    >
                      {updating === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, "rejected")}
                      disabled={updating === order.id}
                      className="flex-1 bg-transparent"
                    >
                      {updating === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                )}

                {order.status === "accepted" && (
                  <div className="pt-2 border-t">
                    <Button
                      onClick={() => updateOrderStatus(order.id, "completed")}
                      disabled={updating === order.id}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      {updating === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Mark as Completed
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
