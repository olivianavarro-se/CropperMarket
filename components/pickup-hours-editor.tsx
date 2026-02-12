"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Clock } from "lucide-react"
import type { PickupSchedule, PickupTimeSlot } from "@/lib/types"

interface PickupHoursEditorProps {
  schedules: PickupSchedule[]
  onChange: (schedules: PickupSchedule[]) => void
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
]

export function PickupHoursEditor({ schedules, onChange }: PickupHoursEditorProps) {
  const addSchedule = () => {
    onChange([
      ...schedules,
      {
        days: [],
        timeSlots: [{ start: "09:00", end: "17:00" }],
      },
    ])
  }

  const removeSchedule = (index: number) => {
    onChange(schedules.filter((_, i) => i !== index))
  }

  const updateScheduleDays = (index: number, day: string, checked: boolean) => {
    const newSchedules = [...schedules]
    if (checked) {
      newSchedules[index].days = [...newSchedules[index].days, day]
    } else {
      newSchedules[index].days = newSchedules[index].days.filter((d) => d !== day)
    }
    onChange(newSchedules)
  }

  const addTimeSlot = (scheduleIndex: number) => {
    const newSchedules = [...schedules]
    newSchedules[scheduleIndex].timeSlots.push({ start: "09:00", end: "17:00" })
    onChange(newSchedules)
  }

  const removeTimeSlot = (scheduleIndex: number, slotIndex: number) => {
    const newSchedules = [...schedules]
    newSchedules[scheduleIndex].timeSlots = newSchedules[scheduleIndex].timeSlots.filter(
      (_, i) => i !== slotIndex,
    )
    onChange(newSchedules)
  }

  const updateTimeSlot = (
    scheduleIndex: number,
    slotIndex: number,
    field: "start" | "end",
    value: string,
  ) => {
    const newSchedules = [...schedules]
    newSchedules[scheduleIndex].timeSlots[slotIndex][field] = value
    onChange(newSchedules)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Pickup Hours</Label>
        <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
          <Plus className="h-4 w-4 mr-1" />
          Add Schedule
        </Button>
      </div>

      {schedules.length === 0 && (
        <p className="text-sm text-muted-foreground">No pickup hours set. Click "Add Schedule" to begin.</p>
      )}

      {schedules.map((schedule, scheduleIndex) => (
        <div key={scheduleIndex} className="border rounded-lg p-4 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              Schedule {scheduleIndex + 1}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeSchedule(scheduleIndex)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-1">
                  <Checkbox
                    id={`${scheduleIndex}-${day.value}`}
                    checked={schedule.days.includes(day.value)}
                    onCheckedChange={(checked) =>
                      updateScheduleDays(scheduleIndex, day.value, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`${scheduleIndex}-${day.value}`}
                    className="text-xs font-normal cursor-pointer"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Time Slots</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addTimeSlot(scheduleIndex)}
                className="h-6 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Slot
              </Button>
            </div>
            <div className="space-y-2">
              {schedule.timeSlots.map((slot, slotIndex) => (
                <div key={slotIndex} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateTimeSlot(scheduleIndex, slotIndex, "start", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateTimeSlot(scheduleIndex, slotIndex, "end", e.target.value)}
                    className="h-8 text-sm"
                  />
                  {schedule.timeSlots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeSlot(scheduleIndex, slotIndex)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PickupHoursDisplay({ schedules }: { schedules: PickupSchedule[] }) {
  if (!schedules || schedules.length === 0) {
    return <p className="text-sm text-muted-foreground">No pickup hours set</p>
  }

  const dayLabels: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "pm" : "am"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes}${ampm}`
  }

  return (
    <div className="space-y-2">
      {schedules.map((schedule, index) => (
        <div key={index} className="flex items-start gap-2 text-sm">
          <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <div className="font-medium">
              {schedule.days.map((day) => dayLabels[day] || day).join(", ")}
            </div>
            <div className="text-muted-foreground">
              {schedule.timeSlots.map((slot, i) => (
                <span key={i}>
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                  {i < schedule.timeSlots.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
