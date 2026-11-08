"use client"

type ServiceKey = "squeeze" | "transport"

interface MapLegendProps {
  type: "all" | "broker" | "grower"
  services: ServiceKey[]
  onTypeChange: (type: "all" | "broker" | "grower") => void
  onToggleService: (service: ServiceKey) => void
  compact?: boolean
}

const CHIPS = [
  { key: "grower", label: "Grower", dot: "bg-grower", active: "bg-grower-bg border-grower" },
  { key: "broker", label: "Broker", dot: "bg-broker", active: "bg-broker-bg border-broker" },
  { key: "squeeze", label: "Squeeze", dot: "bg-squeeze", active: "bg-squeeze-bg border-squeeze" },
  { key: "transport", label: "Transport", dot: "bg-transport", active: "bg-transport-bg border-transport" },
] as const

export function MapLegend({ type, services, onTypeChange, onToggleService, compact = false }: MapLegendProps) {
  return (
    <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`} role="group" aria-label="Filter by pin color">
      {CHIPS.map((chip) => {
        const isType = chip.key === "grower" || chip.key === "broker"
        const pressed = isType ? type === chip.key : services.includes(chip.key as ServiceKey)
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
            className={`flex items-center rounded-full border font-semibold text-foreground transition-colors ${
              compact ? "gap-1 px-2 py-0.5 text-[10px]" : "gap-2 px-3 py-1.5 text-xs"
            } ${pressed ? chip.active : "bg-card border-border hover:bg-muted"}`}
          >
            <span className={`rounded-full ${chip.dot} ${compact ? "w-2 h-2" : "w-2.5 h-2.5"}`} aria-hidden="true" />
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
