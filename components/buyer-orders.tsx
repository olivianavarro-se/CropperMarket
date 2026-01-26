"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, Building2, MapPin, MessageSquare, Clock, RefreshCw, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  supplier: {
    business_name: string
    phone: string | null
    email: string | null
  }
  location: {
    name: string
    city: string
    state: string
  }
}

interface BuyerOrdersProps {
  userId: string
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

const statusDescriptions = {
  pending: "Waiting for supplier response",
  accepted: "Supplier accepted your request",
  rejected: "Supplier declined your request",
  completed: "Order has been completed",
}

export function BuyerOrders({ userId }: BuyerOrdersProps) {
  const [orders, setOrders] = useState<OrderRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected" | "completed">("all")

  const supabase = createClient()

  const fetchOrders = async () => {
    setLoading(true)
    try {
      // Fetch orders with locations
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
        .eq("requester_id", userId)
        .order("created_at", { ascending: false })

      if (ordersError) {
        console.error("[Orders] Error fetching orders:", ordersError.message)
        return
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        return
      }

      // Get unique supplier IDs
      const supplierIds = [...new Set(ordersData.map((o) => o.supplier_id))]

      // Fetch suppliers separately
      const { data: suppliersData, error: suppliersError } = await supabase
        .from("suppliers")
        .select("id, business_name, phone, email")
        .in("id", supplierIds)

      if (suppliersError) {
        console.error("[Orders] Error fetching suppliers:", suppliersError.message)
      }

      // Create suppliers map
      const suppliersMap = new Map(
        (suppliersData || []).map((s) => [s.id, { business_name: s.business_name, phone: s.phone, email: s.email }])
      )

      // Combine orders with supplier info
      const ordersWithSuppliers = ordersData.map((order) => ({
        ...order,
        supplier: suppliersMap.get(order.supplier_id) || { business_name: "Unknown", phone: null, email: null },
      }))

      setOrders(ordersWithSuppliers)
    } catch (err) {
      console.error("[Orders] Unexpected error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [userId])

  const deleteOrder = async (orderId: string) => {
    setDeleting(orderId)
    try {
      const { error } = await supabase
        .from("order_requests")
        .delete()
        .eq("id", orderId)

      if (error) {
        console.error("[Orders] Error deleting order:", error)
        return
      }

      // Remove from local state
      setOrders((prev) => prev.filter((order) => order.id !== orderId))
    } finally {
      setDeleting(null)
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
          <h2 className="text-2xl font-semibold mb-1">My Orders</h2>
          <p className="text-sm text-muted-foreground">
            Track your inventory requests to suppliers
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
                ? "When you request inventory from suppliers, your orders will appear here."
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
                        {order.supplier?.business_name || "Supplier"}
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={deleting === order.id}
                      >
                        {deleting === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this order request? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteOrder(order.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Status Description */}
                <div className={`p-3 rounded-lg text-sm ${
                  order.status === "pending" ? "bg-yellow-50 text-yellow-800" :
                  order.status === "accepted" ? "bg-green-50 text-green-800" :
                  order.status === "rejected" ? "bg-red-50 text-red-800" :
                  "bg-blue-50 text-blue-800"
                }`}>
                  {statusDescriptions[order.status]}
                </div>

                {/* Supplier Contact Info (show only if accepted) */}
                {order.status === "accepted" && (order.supplier?.email || order.supplier?.phone) && (
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Supplier Contact
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {order.supplier?.email && (
                        <a href={`mailto:${order.supplier.email}`} className="text-primary hover:underline">
                          {order.supplier.email}
                        </a>
                      )}
                      {order.supplier?.phone && (
                        <a href={`tel:${order.supplier.phone}`} className="text-primary hover:underline">
                          {order.supplier.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}

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

                {/* Your Message */}
                {order.message && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-blue-900">
                      <MessageSquare className="h-4 w-4" />
                      Your Message
                    </h4>
                    <p className="text-sm text-blue-800">{order.message}</p>
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
