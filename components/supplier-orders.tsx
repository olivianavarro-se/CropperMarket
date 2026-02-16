"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, Package, User, Mail, Phone, MapPin, MessageSquare, Clock, Check, X, RefreshCw, Trash2, ShoppingCart, Store } from "lucide-react"
import { PickupHoursDisplay } from "@/components/pickup-hours-editor"
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

export function SupplierOrders({ supplierId, userId }: SupplierOrdersProps) {
  const [incomingOrders, setIncomingOrders] = useState<OrderRequest[]>([])
  const [myRequests, setMyRequests] = useState<OrderRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [incomingFilter, setIncomingFilter] = useState<"all" | "pending" | "accepted" | "rejected" | "completed">("all")
  const [requestsFilter, setRequestsFilter] = useState<"all" | "pending" | "accepted" | "rejected" | "completed">("all")
  const [activeTab, setActiveTab] = useState("incoming")

  const supabase = createClient()

  const fetchOrders = async () => {
    setLoading(true)
    try {
      // Fetch INCOMING orders (where I'm the supplier)
      const { data: incomingData, error: incomingError } = await supabase
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

      // Fetch MY REQUESTS (where I'm the requester)
      const { data: requestsData, error: requestsError } = await supabase
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

      if (incomingError) {
        console.error("[Orders] Error fetching incoming orders:", incomingError.message)
      }

      if (requestsError) {
        console.error("[Orders] Error fetching my requests:", requestsError.message)
      }

      // Get unique profile IDs from both
      const allProfileIds = new Set([
        ...(incomingData || []).map((o) => o.requester_id),
        ...(requestsData || []).map((o) => o.supplier_id),
      ])

      // Fetch all profiles only if there are IDs to fetch
      let profilesMap = new Map()
      if (allProfileIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", Array.from(allProfileIds))

        if (profilesError) {
          console.error("[Orders] Error fetching profiles:", profilesError.message)
        }

        // Create profiles map
        profilesMap = new Map(
          (profilesData || []).map((p) => [p.id, { full_name: p.full_name, email: p.email, phone: p.phone }])
        )
      }

      // Get supplier info for my requests
      const supplierIds = [...new Set((requestsData || []).map((o) => o.supplier_id))]
      let suppliersMap = new Map()
      if (supplierIds.length > 0) {
        const { data: suppliersData } = await supabase
          .from("suppliers")
          .select("id, business_name, phone, email, pickup_hours")
          .in("id", supplierIds)

        suppliersMap = new Map(
          (suppliersData || []).map((s) => [s.id, { business_name: s.business_name, phone: s.phone, email: s.email, pickup_hours: s.pickup_hours }])
        )
      }

      // Combine incoming orders with requester info
      const incomingWithRequesters = (incomingData || []).map((order) => ({
        ...order,
        requester: profilesMap.get(order.requester_id) || { full_name: null, email: "Unknown", phone: null },
      }))

      // Combine my requests with supplier info
      const requestsWithSuppliers = (requestsData || []).map((order) => ({
        ...order,
        supplier: suppliersMap.get(order.supplier_id) || { business_name: "Unknown", phone: null, email: null, pickup_hours: [] },
      }))

      setIncomingOrders(incomingWithRequesters)
      setMyRequests(requestsWithSuppliers as any)
    } catch (err) {
      console.error("[Orders] Unexpected error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [supplierId, userId])

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

      // Update local state for both incoming orders and my requests
      setIncomingOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
      setMyRequests((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
    } finally {
      setUpdating(null)
    }
  }

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

      // Remove from local state for both incoming orders and my requests
      setIncomingOrders((prev) => prev.filter((order) => order.id !== orderId))
      setMyRequests((prev) => prev.filter((order) => order.id !== orderId))
    } finally {
      setDeleting(null)
    }
  }

  const filteredIncomingOrders = incomingFilter === "all" ? incomingOrders : incomingOrders.filter((order) => order.status === incomingFilter)
  const filteredMyRequests = requestsFilter === "all" ? myRequests : myRequests.filter((order) => order.status === requestsFilter)

  const incomingPendingCount = incomingOrders.filter((o) => o.status === "pending").length
  const myRequestsAcceptedCount = myRequests.filter((o) => o.status === "accepted").length

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

  const renderOrderCard = (order: any, isIncoming: boolean) => (
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
                {/* Customer/Supplier Info */}
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {isIncoming ? "Customer Information" : "Supplier Information"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{isIncoming ? (order.requester?.full_name || "No name provided") : (order.supplier?.business_name || "Unknown")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${isIncoming ? order.requester?.email : order.supplier?.email}`} className="text-primary hover:underline">
                        {isIncoming ? order.requester?.email : order.supplier?.email}
                      </a>
                    </div>
                    {((isIncoming && order.requester?.phone) || (!isIncoming && order.supplier?.phone)) && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${isIncoming ? order.requester.phone : order.supplier.phone}`} className="text-primary hover:underline">
                          {isIncoming ? order.requester.phone : order.supplier.phone}
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

                {/* Actions - Only for incoming orders */}
                {isIncoming && order.status === "pending" && (
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

                {isIncoming && order.status === "accepted" && (
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

                {/* Pickup Hours for my requests */}
                {!isIncoming && order.status === "accepted" && (
                  <>
                    {order.supplier?.pickup_hours && order.supplier.pickup_hours.length > 0 ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-green-900">
                          <Clock className="h-4 w-4" />
                          Pickup Availability
                        </h4>
                        <PickupHoursDisplay schedules={order.supplier.pickup_hours} />
                        <p className="mt-3 text-sm text-green-800 font-medium">
                          Call to make an appointment for pickup.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">
                          Your request has been accepted! Contact the supplier to arrange pickup.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Orders</h2>
          <p className="text-sm text-muted-foreground">
            Manage incoming orders and track your requests
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="bg-transparent">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="incoming" className="relative">
            <Store className="h-4 w-4 mr-2" />
            Incoming Orders
            {incomingPendingCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white px-1.5 py-0 text-xs h-5 min-w-5">
                {incomingPendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            <ShoppingCart className="h-4 w-4 mr-2" />
            My Requests
            {myRequestsAcceptedCount > 0 && (
              <Badge className="ml-2 bg-green-500 text-white px-1.5 py-0 text-xs h-5 min-w-5">
                {myRequestsAcceptedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4">
          {/* Incoming Orders Filter */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "accepted", "rejected", "completed"] as const).map((status) => (
              <Button
                key={status}
                variant={incomingFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setIncomingFilter(status)}
                className={incomingFilter !== status ? "bg-transparent" : ""}
              >
                {status === "all" ? "All" : statusLabels[status]}
                {status !== "all" && (
                  <span className="ml-2 text-xs">
                    ({incomingOrders.filter((o) => o.status === status).length})
                  </span>
                )}
              </Button>
            ))}
          </div>

          {filteredIncomingOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Incoming Orders</h3>
                <p className="text-muted-foreground">
                  {incomingFilter === "all"
                    ? "When buyers request your inventory, their orders will appear here."
                    : `No ${incomingFilter} orders found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredIncomingOrders.map((order) => renderOrderCard(order, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {/* My Requests Filter */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "accepted", "rejected", "completed"] as const).map((status) => (
              <Button
                key={status}
                variant={requestsFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setRequestsFilter(status)}
                className={requestsFilter !== status ? "bg-transparent" : ""}
              >
                {status === "all" ? "All" : statusLabels[status]}
                {status !== "all" && (
                  <span className="ml-2 text-xs">
                    ({myRequests.filter((o) => o.status === status).length})
                  </span>
                )}
              </Button>
            ))}
          </div>

          {filteredMyRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
                <p className="text-muted-foreground">
                  {requestsFilter === "all"
                    ? "When you request inventory from suppliers, your requests will appear here."
                    : `No ${requestsFilter} requests found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredMyRequests.map((order) => renderOrderCard(order, false))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
