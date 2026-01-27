"use client"

import { useState } from "react"
import { Inbox, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierOrders } from "@/components/supplier-orders"
import { BuyerOrders } from "@/components/buyer-orders"

interface SupplierOrdersWrapperProps {
  supplierId: string
  userId: string
}

type SubTab = "incoming" | "my-requests"

export function SupplierOrdersWrapper({ supplierId, userId }: SupplierOrdersWrapperProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("incoming")

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <div className="flex gap-2 border-b pb-4">
        <button
          onClick={() => setActiveSubTab("incoming")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            activeSubTab === "incoming"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Inbox className="h-4 w-4" />
          Incoming Orders
        </button>
        <button
          onClick={() => setActiveSubTab("my-requests")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            activeSubTab === "my-requests"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Send className="h-4 w-4" />
          My Requests
        </button>
      </div>

      {/* Content */}
      {activeSubTab === "incoming" && (
        <SupplierOrders supplierId={supplierId} />
      )}

      {activeSubTab === "my-requests" && (
        <BuyerOrders userId={userId} />
      )}
    </div>
  )
}
