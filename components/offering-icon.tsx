import { Package, Truck, Wheat } from "lucide-react"
import type { Offering } from "@/lib/location-services"

const ICONS = { hay: Wheat, squeeze: Package, transport: Truck } as const

interface OfferingIconProps {
  offering: Offering
  color: string
  size?: "sm" | "md"
  inverted?: boolean
  label?: string
}

export function OfferingIcon({ offering, color, size = "md", inverted = false, label }: OfferingIconProps) {
  const Icon = ICONS[offering]
  const box = size === "sm" ? "size-5" : "size-6"
  const icon = size === "sm" ? "size-3" : "size-3.5"

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${box} ${inverted ? "bg-card" : ""}`}
      style={inverted ? undefined : { backgroundColor: color }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      title={label}
    >
      <Icon className={icon} strokeWidth={2.25} style={{ color: inverted ? color : "var(--color-card, #fff)" }} />
    </span>
  )
}
