"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Building2, MapPin, Calendar, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Supplier, Location, Inventory } from "@/lib/types"
import { SupplierProfile } from "@/components/supplier-profile"
import { LocationList } from "@/components/location-list"
import { SupplierOrdersWrapper } from "@/components/supplier-orders-wrapper"
import { SupplierOrders } from "@/components/supplier-orders" // Import SupplierOrders component
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface LocationWithInventory extends Location {
  inventory: Inventory[]
}

interface DashboardTabsProps {
  supplier: Supplier
  userId: string
  locations: LocationWithInventory[]
}

type TabId = "profile" | "locations" | "calendar" | "orders"

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: "profile", label: "Business Profile", icon: Building2 },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "locations", label: "Locations & Inventory", icon: MapPin },
  { id: "calendar", label: "Calendar", icon: Calendar },
]

export function DashboardTabs({ supplier, userId, locations }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile")
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count } = await supabase
        .from("order_requests")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", supplier.id)
        .eq("status", "pending")
      
      setPendingOrdersCount(count || 0)
    }

    fetchPendingCount()

    // Subscribe to order changes
    const channel = supabase
      .channel("order-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_requests",
          filter: `supplier_id=eq.${supplier.id}`,
        },
        () => {
          fetchPendingCount()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supplier.id])

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
      {/* Mobile horizontal scrollable tabs -- visible below md */}
      <div className="md:hidden overflow-x-auto -mx-3 px-3 pb-1">
        <nav className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.id === "orders" && pendingOrdersCount > 0 && (
                  <Badge variant="destructive" className="ml-0.5 h-5 min-w-5 px-1.5 text-[10px]">
                    {pendingOrdersCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Desktop sidebar -- hidden below md, identical to original */}
      <aside className="hidden md:block w-64 shrink-0">
        <nav className="space-y-1 sticky top-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{tab.label}</span>
                {tab.id === "orders" && pendingOrdersCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingOrdersCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Business Profile</h2>
              <p className="text-sm text-muted-foreground">
                Manage your business information and settings
              </p>
            </div>
            <SupplierProfile supplier={supplier} userId={userId} />
          </div>
        )}

        {activeTab === "locations" && (
          <LocationList locations={locations} supplierId={supplier.id} />
        )}

        {activeTab === "calendar" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Calendar</h2>
              <p className="text-sm text-muted-foreground">
                Manage your availability and schedule
              </p>
            </div>
            <div className="bg-card border rounded-lg p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Calendar Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Schedule deliveries, set availability, and manage appointments with your calendar.
              </p>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <SupplierOrdersWrapper supplierId={supplier.id} userId={userId} />
        )}
      </div>
    </div>
  )
}
