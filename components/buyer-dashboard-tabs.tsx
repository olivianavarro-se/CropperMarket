"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Calendar, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { BuyerOrders } from "@/components/buyer-orders"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface BuyerDashboardTabsProps {
  userId: string
}

type TabId = "orders" | "calendar"

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: "orders", label: "My Orders", icon: ShoppingCart },
  { id: "calendar", label: "Calendar", icon: Calendar },
]

export function BuyerDashboardTabs({ userId }: BuyerDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("orders")
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchNewOrdersCount = async () => {
      const { count } = await supabase
        .from("order_requests")
        .select("*", { count: "exact", head: true })
        .eq("requester_id", userId)
        .eq("status", "accepted")
      
      setNewOrdersCount(count || 0)
    }

    fetchNewOrdersCount()

    // Subscribe to order changes
    const channel = supabase
      .channel("buyer-order-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_requests",
          filter: `requester_id=eq.${userId}`,
        },
        () => {
          fetchNewOrdersCount()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId])

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
                {tab.id === "orders" && newOrdersCount > 0 && (
                  <Badge variant="destructive" className="ml-0.5 h-5 min-w-5 px-1.5 text-[10px]">
                    {newOrdersCount}
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
                {tab.id === "orders" && newOrdersCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {newOrdersCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {activeTab === "orders" && <BuyerOrders userId={userId} />}

        {activeTab === "calendar" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Calendar</h2>
              <p className="text-sm text-muted-foreground">
                Track your scheduled deliveries and appointments
              </p>
            </div>
            <div className="bg-card border rounded-lg p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Calendar Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                View scheduled deliveries, set reminders, and manage your purchase calendar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
