"use client"

import { OfferingIcon } from "@/components/offering-icon"
import { PIN_COLORS, type Offering } from "@/lib/location-services"

type ServiceKey = "squeeze" | "transport"

interface MapLegendProps {
  type: "all" | "broker" | "grower"
  services: ServiceKey[]
  onTypeChange: (type: "all" | "broker" | "grower") => void
  onToggleService: (service: ServiceKey) => void
  compact?: boolean
}

const CHIPS: { key: keyof typeof PIN_COLORS; label: string; offering: Offering }[] = [
  { key: "grower", label: "Grower", offering: "hay" },
  { key: "broker", label: "Broker", offering: "hay" },
  { key: "squeeze", label: "Squeeze", offering: "squeeze" },
  { key: "transport", label: "Transport", offering: "transport" },
]

export function MapLegend({ type, services, onTypeChange, onToggleService, compact = false }: MapLegendProps) {
  return (
    <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`} role="group" aria-label="Filter by pin type">
      {CHIPS.map((chip) => {
        const isType = chip.key === "grower" || chip.key === "broker"
        const pressed = isType ? type === chip.key : services.includes(chip.key as ServiceKey)
        const color = PIN_COLORS[chip.key]
        const handleClick = () => {
          if (isType) onTypeChange(pressed ? "all" : (chip.key as "grower" | "broker"))
          else onToggleService(chip.key as ServiceKey)
        }
        return (
          <button
            key={chip.key}
            type="button"
            aria-pressed={pressed}
            onClick={handleClick}
            className={`flex items-center rounded-full border font-semibold transition-colors ${
              compact ? "gap-1 py-0.5 pl-0.5 pr-2 text-[11px]" : "gap-1.5 py-0.5 pl-0.5 pr-3 text-xs"
            } ${pressed ? "text-card" : "border-hay-border bg-card text-foreground hover:border-hay-warm"}`}
            style={pressed ? { backgroundColor: color, borderColor: color } : undefined}
          >
            <OfferingIcon offering={chip.offering} color={color} size={compact ? "sm" : "md"} inverted={pressed} />
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
