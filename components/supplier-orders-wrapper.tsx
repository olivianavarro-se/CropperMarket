"use client"

import { SupplierOrders } from "@/components/supplier-orders"

interface SupplierOrdersWrapperProps {
  supplierId: string
  userId: string
}

export function SupplierOrdersWrapper({ supplierId, userId }: SupplierOrdersWrapperProps) {
  return <SupplierOrders supplierId={supplierId} userId={userId} />
}
