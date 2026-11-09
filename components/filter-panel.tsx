"use client"

import type { Dispatch, ReactNode, SetStateAction } from "react"
import { PackageCheck, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { OfferingIcon } from "@/components/offering-icon"
import { HAY_TYPES } from "@/lib/hay-types"
import { PIN_COLORS } from "@/lib/location-services"

export type ServiceKey = "squeeze" | "transport"

export type FilterOptions = {
  type: "all" | "broker" | "grower"
  services: ServiceKey[]
  hasInventory: boolean
  deliveryAvailable: boolean
  hayTypes: string[]
  customHayType: string
  zipCode: string
  minPrice: string
  maxPrice: string
  cities: string[]
  states: string[]
  sellingUnits: string[]
}

export const EMPTY_FILTERS: FilterOptions = {
  type: "all",
  services: [],
  hasInventory: false,
  deliveryAvailable: false,
  hayTypes: [],
  customHayType: "",
  zipCode: "",
  minPrice: "",
  maxPrice: "",
  cities: [],
  states: [],
  sellingUnits: [],
}

const SUPPLIER_TYPES = [
  { value: "all", label: "All" },
  { value: "grower", label: "Grower" },
  { value: "broker", label: "Broker" },
] as const

const SELLING_UNITS = [
  { value: "tons", label: "Tons" },
  { value: "small_bales", label: "Small Bales" },
  { value: "large_bales", label: "Large Bales" },
  { value: "round_bales", label: "Round Bales" },
  { value: "bundles", label: "Bundles" },
]

type ListKey = "services" | "hayTypes" | "sellingUnits" | "states" | "cities"

interface FilterPanelProps {
  filters: FilterOptions
  setFilters: Dispatch<SetStateAction<FilterOptions>>
  availableStates: string[]
  availableCities: string[]
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-hay-medium">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  )
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
        pressed
          ? "border-hay-dark bg-hay-dark text-hay-bg"
          : "border-hay-border bg-card text-foreground hover:border-hay-warm"
      }`}
    >
      {children}
    </button>
  )
}

function ToggleRow({
  id,
  icon,
  label,
  checked,
  onChange,
}: {
  id: string
  icon: ReactNode
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        checked ? "border-hay-warm bg-hay-bg-alt" : "border-hay-border bg-card hover:border-hay-warm"
      }`}
    >
      {icon}
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function ClearLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-xs font-medium text-hay-medium hover:text-foreground">
      Clear
    </button>
  )
}

export function FilterPanel({ filters, setFilters, availableStates, availableCities }: FilterPanelProps) {
  const toggleInList = (key: ListKey, value: string) =>
    setFilters((prev) => {
      const list = prev[key] as string[]
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] }
    })

  const neutralIcon = (Icon: typeof Truck) => (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-hay-glow" aria-hidden="true">
      <Icon className="size-3.5 text-hay-dark" strokeWidth={2.25} />
    </span>
  )

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
      <Section title="Supplier type">
        <div className="flex rounded-full bg-hay-bg-alt p-1" role="group" aria-label="Supplier type">
          {SUPPLIER_TYPES.map((option) => {
            const pressed = filters.type === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={pressed}
                onClick={() => setFilters((prev) => ({ ...prev, type: option.value }))}
                className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-all ${
                  pressed ? "bg-card text-foreground shadow-sm" : "text-hay-medium hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Services">
        <div className="flex flex-col gap-2">
          <ToggleRow
            id="service-squeeze"
            icon={<OfferingIcon offering="squeeze" color={PIN_COLORS.squeeze} />}
            label="Hay squeeze"
            checked={filters.services.includes("squeeze")}
            onChange={() => toggleInList("services", "squeeze")}
          />
          <ToggleRow
            id="service-transport"
            icon={<OfferingIcon offering="transport" color={PIN_COLORS.transport} />}
            label="Hay transport"
            checked={filters.services.includes("transport")}
            onChange={() => toggleInList("services", "transport")}
          />
        </div>
      </Section>

      <Section
        title="Hay type"
        action={
          filters.hayTypes.length > 0 ? (
            <ClearLink onClick={() => setFilters((prev) => ({ ...prev, hayTypes: [], customHayType: "" }))} />
          ) : null
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {HAY_TYPES.map((hayType) => (
            <Chip
              key={hayType}
              pressed={filters.hayTypes.includes(hayType)}
              onClick={() => toggleInList("hayTypes", hayType)}
            >
              {hayType}
            </Chip>
          ))}
        </div>
        {filters.hayTypes.includes("Other") && (
          <Input
            aria-label="Custom hay type"
            placeholder="Enter custom hay type..."
            value={filters.customHayType}
            onChange={(e) => setFilters((prev) => ({ ...prev, customHayType: e.target.value }))}
            className="rounded-xl border-hay-border text-sm"
          />
        )}
      </Section>

      <Section
        title="Selling unit"
        action={
          filters.sellingUnits.length > 0 ? (
            <ClearLink onClick={() => setFilters((prev) => ({ ...prev, sellingUnits: [] }))} />
          ) : null
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {SELLING_UNITS.map((unit) => (
            <Chip
              key={unit.value}
              pressed={filters.sellingUnits.includes(unit.value)}
              onClick={() => toggleInList("sellingUnits", unit.value)}
            >
              {unit.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="ZIP code">
        <Input
          aria-label="ZIP code"
          placeholder="Enter ZIP code"
          inputMode="numeric"
          value={filters.zipCode}
          onChange={(e) => setFilters((prev) => ({ ...prev, zipCode: e.target.value }))}
          className="rounded-xl border-hay-border"
        />
      </Section>

      <Section title="Price range (per unit)">
        <div className="flex items-center gap-2">
          <Input
            aria-label="Minimum price"
            placeholder="Min"
            type="number"
            value={filters.minPrice}
            onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
            className="rounded-xl border-hay-border"
          />
          <span className="text-sm text-hay-medium" aria-hidden="true">
            {"–"}
          </span>
          <Input
            aria-label="Maximum price"
            placeholder="Max"
            type="number"
            value={filters.maxPrice}
            onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
            className="rounded-xl border-hay-border"
          />
        </div>
      </Section>

      <Section title="Availability">
        <div className="flex flex-col gap-2">
          <ToggleRow
            id="has-inventory"
            icon={neutralIcon(PackageCheck)}
            label="Has inventory available"
            checked={filters.hasInventory}
            onChange={(checked) => setFilters((prev) => ({ ...prev, hasInventory: checked }))}
          />
          <ToggleRow
            id="offers-delivery"
            icon={neutralIcon(Truck)}
            label="Offers delivery"
            checked={filters.deliveryAvailable}
            onChange={(checked) => setFilters((prev) => ({ ...prev, deliveryAvailable: checked }))}
          />
        </div>
      </Section>

      {availableStates.length > 0 && (
        <Section
          title="State"
          action={
            filters.states.length > 0 ? <ClearLink onClick={() => setFilters((prev) => ({ ...prev, states: [] }))} /> : null
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {availableStates.map((state) => (
              <Chip key={state} pressed={filters.states.includes(state)} onClick={() => toggleInList("states", state)}>
                {state}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {availableCities.length > 0 && (
        <Section
          title="City"
          action={
            filters.cities.length > 0 ? <ClearLink onClick={() => setFilters((prev) => ({ ...prev, cities: [] }))} /> : null
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {availableCities.map((city) => (
              <Chip key={city} pressed={filters.cities.includes(city)} onClick={() => toggleInList("cities", city)}>
                {city}
              </Chip>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
