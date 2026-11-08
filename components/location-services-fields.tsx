"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export interface LocationServicesValue {
  offersSqueeze: boolean
  offersTransport: boolean
  squeezeNotes: string
  transportNotes: string
}

export const EMPTY_SERVICES: LocationServicesValue = {
  offersSqueeze: false,
  offersTransport: false,
  squeezeNotes: "",
  transportNotes: "",
}

export function servicesToColumns(value: LocationServicesValue) {
  return {
    offers_squeeze: value.offersSqueeze,
    offers_transport: value.offersTransport,
    squeeze_notes: value.offersSqueeze ? value.squeezeNotes.trim() || null : null,
    transport_notes: value.offersTransport ? value.transportNotes.trim() || null : null,
  }
}

interface LocationServicesFieldsProps {
  idPrefix: string
  value: LocationServicesValue
  onChange: (value: LocationServicesValue) => void
}

export function LocationServicesFields({ idPrefix, value, onChange }: LocationServicesFieldsProps) {
  const update = (patch: Partial<LocationServicesValue>) => onChange({ ...value, ...patch })

  return (
    <fieldset className="flex flex-col gap-3 p-4 bg-card rounded-lg border">
      <legend className="sr-only">Services at this location</legend>
      <div>
        <p className="text-sm font-medium">Services at this location</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Buyers will see these on the map with your contact info so they can call you.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${idPrefix}-squeeze`}
            checked={value.offersSqueeze}
            onCheckedChange={(checked) => update({ offersSqueeze: checked === true })}
          />
          <Label htmlFor={`${idPrefix}-squeeze`} className="cursor-pointer font-normal flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-squeeze" aria-hidden="true" />
            Hay squeeze
          </Label>
        </div>
        {value.offersSqueeze && (
          <Textarea
            aria-label="Hay squeeze notes"
            value={value.squeezeNotes}
            onChange={(e) => update({ squeezeNotes: e.target.value })}
            placeholder="e.g., Available Mon–Sat, loads up to 42 small bales"
            rows={2}
            maxLength={300}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${idPrefix}-transport`}
            checked={value.offersTransport}
            onCheckedChange={(checked) => update({ offersTransport: checked === true })}
          />
          <Label htmlFor={`${idPrefix}-transport`} className="cursor-pointer font-normal flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-transport" aria-hidden="true" />
            Hay transport
          </Label>
        </div>
        {value.offersTransport && (
          <Textarea
            aria-label="Transport notes"
            value={value.transportNotes}
            onChange={(e) => update({ transportNotes: e.target.value })}
            placeholder="e.g., Hauling within 150 miles, call for rates"
            rows={2}
            maxLength={300}
          />
        )}
      </div>
    </fieldset>
  )
}
