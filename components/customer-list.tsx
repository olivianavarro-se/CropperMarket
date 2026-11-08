"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { ChevronDown, Mail, Phone, Plus, Search, Trash2, UserCheck, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AddCustomerDialog } from "@/components/add-customer-dialog"

interface OrderItem {
  product_name: string
  quantity: number
  price_per_unit: number
}

interface OrderRow {
  id: string
  requester_id: string
  status: string
  requested_items: OrderItem[]
  created_at: string
}

interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

interface ManualCustomerRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

export interface CustomerSummary {
  key: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  isRegistered: boolean
  manualId: string | null
  orders: OrderRow[]
  totalOrders: number
  completedOrders: number
  openOrders: number
  revenue: number
  lastOrderAt: string | null
  firstOrderAt: string | null
  topProduct: string | null
}

const REVENUE_STATUSES = new Set(["accepted", "completed"])
const OPEN_STATUSES = new Set(["pending", "accepted"])

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function orderTotal(order: OrderRow) {
  return (order.requested_items || []).reduce((sum, item) => sum + item.price_per_unit * item.quantity, 0)
}

function summarize(base: Omit<CustomerSummary, "totalOrders" | "completedOrders" | "openOrders" | "revenue" | "lastOrderAt" | "firstOrderAt" | "topProduct">): CustomerSummary {
  const sorted = [...base.orders].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const productCounts = new Map<string, number>()
  for (const order of sorted) {
    for (const item of order.requested_items || []) {
      productCounts.set(item.product_name, (productCounts.get(item.product_name) || 0) + 1)
    }
  }
  const topProduct = [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    ...base,
    orders: sorted,
    totalOrders: sorted.length,
    completedOrders: sorted.filter((o) => o.status === "completed").length,
    openOrders: sorted.filter((o) => OPEN_STATUSES.has(o.status)).length,
    revenue: sorted.filter((o) => REVENUE_STATUSES.has(o.status)).reduce((sum, o) => sum + orderTotal(o), 0),
    lastOrderAt: sorted[0]?.created_at ?? null,
    firstOrderAt: sorted[sorted.length - 1]?.created_at ?? null,
    topProduct,
  }
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
}

export function CustomerList({ supplierId }: { supplierId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    const [{ data: orders }, { data: manual }] = await Promise.all([
      supabase
        .from("order_requests")
        .select("id, requester_id, status, requested_items, created_at")
        .eq("supplier_id", supplierId),
      supabase
        .from("supplier_customers")
        .select("id, name, email, phone, notes, created_at")
        .eq("supplier_id", supplierId),
    ])

    const orderRows = (orders || []) as OrderRow[]
    const manualRows = (manual || []) as ManualCustomerRow[]
    const requesterIds = [...new Set(orderRows.map((o) => o.requester_id))]

    const { data: profiles } = requesterIds.length
      ? await supabase.from("profiles").select("id, full_name, email, phone").in("id", requesterIds)
      : { data: [] as ProfileRow[] }

    const ordersByRequester = new Map<string, OrderRow[]>()
    for (const order of orderRows) {
      const list = ordersByRequester.get(order.requester_id) || []
      list.push(order)
      ordersByRequester.set(order.requester_id, list)
    }

    const manualByEmail = new Map<string, ManualCustomerRow>()
    for (const m of manualRows) if (m.email) manualByEmail.set(m.email.toLowerCase(), m)

    const usedManual = new Set<string>()
    const result: CustomerSummary[] = []

    for (const profile of (profiles || []) as ProfileRow[]) {
      const match = profile.email ? manualByEmail.get(profile.email.toLowerCase()) : undefined
      if (match) usedManual.add(match.id)
      result.push(
        summarize({
          key: `buyer-${profile.id}`,
          name: profile.full_name || match?.name || profile.email || "Unnamed buyer",
          email: profile.email,
          phone: profile.phone || match?.phone || null,
          notes: match?.notes ?? null,
          isRegistered: true,
          manualId: match?.id ?? null,
          orders: ordersByRequester.get(profile.id) || [],
        }),
      )
    }

    for (const m of manualRows) {
      if (usedManual.has(m.id)) continue
      result.push(
        summarize({
          key: `manual-${m.id}`,
          name: m.name,
          email: m.email,
          phone: m.phone,
          notes: m.notes,
          isRegistered: false,
          manualId: m.id,
          orders: [],
        }),
      )
    }

    result.sort((a, b) => (b.lastOrderAt || "").localeCompare(a.lastOrderAt || "") || a.name.localeCompare(b.name))
    setCustomers(result)
    setLoading(false)
  }, [supabase, supplierId])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (manualId: string) => {
    if (!confirm("Remove this customer from your list?")) return
    const { error } = await supabase.from("supplier_customers").delete().eq("id", manualId)
    if (!error) load()
  }

  const filtered = customers.filter((c) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(q))
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Customer List</h2>
          <p className="text-sm text-muted-foreground">Everyone you&apos;ve sold to, plus customers you add yourself</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or phone"
          className="pl-9 bg-card"
          aria-label="Search customers"
        />
      </div>

      {loading ? (
        <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">Loading customers...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-1">
            {customers.length === 0 ? "No customers yet" : "No customers match your search"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {customers.length === 0
              ? "Buyers who send you orders appear here automatically. You can also add customers manually."
              : "Try a different name, email or phone number."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((c) => {
            const isOpen = expanded === c.key
            return (
              <li key={c.key} className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 md:p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base truncate">{c.name}</h3>
                        {c.isRegistered ? (
                          <Badge variant="outline" className="gap-1 bg-green-50 text-green-800 border-green-200">
                            <UserCheck className="h-3 w-3" />
                            Registered buyer
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Added manually
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                            <Mail className="h-3.5 w-3.5" />
                            {c.email}
                          </a>
                        )}
                        {c.phone && (
                          <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {c.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    {c.manualId && !c.isRegistered && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.manualId!)}
                        aria-label={`Remove ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {c.isRegistered && (
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Stat label="Orders" value={String(c.totalOrders)} />
                      <Stat label="Open" value={String(c.openOrders)} />
                      <Stat label="Total spent" value={currency.format(c.revenue)} highlight />
                      <Stat
                        label="Last order"
                        value={c.lastOrderAt ? formatDistanceToNow(new Date(c.lastOrderAt), { addSuffix: true }) : "-"}
                      />
                    </dl>
                  )}

                  {(c.topProduct || c.firstOrderAt || c.notes) && (
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {c.topProduct && (
                        <p>
                          Most ordered: <span className="text-foreground font-medium">{c.topProduct}</span>
                        </p>
                      )}
                      {c.firstOrderAt && <p>Customer since {format(new Date(c.firstOrderAt), "MMM d, yyyy")}</p>}
                      {c.notes && <p className="text-pretty">{c.notes}</p>}
                    </div>
                  )}

                  {c.orders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : c.key)}
                      aria-expanded={isOpen}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary self-start"
                    >
                      {isOpen ? "Hide" : "View"} order history
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  )}

                  {isOpen && (
                    <ul className="flex flex-col gap-2">
                      {c.orders.map((o) => (
                        <li
                          key={o.id}
                          className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm"
                        >
                          <div className="min-w-0 flex flex-col">
                            <span className="truncate">
                              {o.requested_items.map((i) => `${i.product_name} x ${i.quantity}`).join(", ")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(o.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-green-700">{currency.format(orderTotal(o))}</span>
                            <Badge variant="outline" className={cn("capitalize", statusStyles[o.status])}>
                              {o.status}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AddCustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} supplierId={supplierId} onCreated={load} />
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm font-semibold", highlight && "text-green-700")}>{value}</dd>
    </div>
  )
}
