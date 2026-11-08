import type { Location, LocationWithSupplier, SupplierType } from "@/lib/types"

export type Offering = "hay" | "squeeze" | "transport"

export const OFFERING_LABELS: Record<Offering, string> = {
  hay: "Hay for sale",
  squeeze: "Hay squeeze",
  transport: "Transport",
}

// Map pins are drawn outside Tailwind, so these hex values mirror the theme tokens in globals.css.
export const PIN_COLORS = {
  grower: "#16a34a",
  broker: "#ca8a04",
  squeeze: "#2563eb",
  transport: "#b91c1c",
} as const

type LocationLike = Pick<Location, "offers_squeeze" | "offers_transport"> & { inventory?: unknown[] | null }

export function hasHay(location: LocationLike) {
  return !!location.inventory && location.inventory.length > 0
}

export function getOfferings(location: LocationLike): Offering[] {
  const offerings: Offering[] = []
  if (hasHay(location)) offerings.push("hay")
  if (location.offers_squeeze) offerings.push("squeeze")
  if (location.offers_transport) offerings.push("transport")
  return offerings
}

export function getOfferingColor(offering: Offering, supplierType: SupplierType) {
  if (offering === "hay") return supplierType === "broker" ? PIN_COLORS.broker : PIN_COLORS.grower
  return PIN_COLORS[offering]
}

export function getPinColors(location: LocationWithSupplier) {
  return getOfferings(location).map((offering) => getOfferingColor(offering, location.supplier.supplier_type))
}
