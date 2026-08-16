"use client"

import { useEffect, useState } from "react"
import { addHours, format, addDays, startOfToday } from "date-fns"
import { Input } from "@/components/ui/input"
import { Chip } from "@/components/ui/chip"
import { useEventCallback } from "@/lib/hooks/use-event-callback"
import { cn } from "@/lib/utils/cn"

interface OrderSchedulingProps {
  onScheduleChange: (scheduledTime: Date | null, timeSlot: string | null) => void
}

const quickSlots = [
  { hours: 1, label: "In 1 hour" },
  { hours: 2, label: "In 2 hours" },
  { hours: 3, label: "In 3 hours" },
]

export function OrderScheduling({
  onScheduleChange: onScheduleChangeProp,
}: OrderSchedulingProps) {
  const onScheduleChange = useEventCallback(onScheduleChangeProp)
  const [mode, setMode] = useState<"now" | "later">("now")
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [time, setTime] = useState(() =>
    format(addHours(new Date(), 1), "HH:mm")
  )
  const [error, setError] = useState<string | null>(null)

  const today = startOfToday()
  const maxDate = format(addDays(today, 7), "yyyy-MM-dd")

  // Report upward whenever the choice changes, so the parent never has to poll.
  useEffect(() => {
    if (mode === "now") {
      setError(null)
      onScheduleChange(null, null)
      return
    }

    const parsed = new Date(`${date}T${time}`)
    if (Number.isNaN(parsed.getTime())) {
      setError("Pick a valid date and time")
      onScheduleChange(null, null)
      return
    }
    if (parsed <= new Date()) {
      setError("Pick a time in the future")
      onScheduleChange(null, null)
      return
    }

    setError(null)
    onScheduleChange(parsed, `${date} ${time}`)
  }, [mode, date, time, onScheduleChange])

  const applyQuickSlot = (hours: number) => {
    const target = addHours(new Date(), hours)
    setDate(format(target, "yyyy-MM-dd"))
    setTime(format(target, "HH:mm"))
    setMode("later")
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("now")}
          aria-pressed={mode === "now"}
          className={cn(
            "min-h-touch rounded-xl border px-4 text-sm font-semibold transition-colors",
            mode === "now"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-surface text-muted-foreground"
          )}
        >
          Order now
        </button>
        <button
          type="button"
          onClick={() => setMode("later")}
          aria-pressed={mode === "later"}
          className={cn(
            "min-h-touch rounded-xl border px-4 text-sm font-semibold transition-colors",
            mode === "later"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-surface text-muted-foreground"
          )}
        >
          Schedule
        </button>
      </div>

      {mode === "now" ? (
        <p className="text-sm text-muted-foreground">
          The kitchen starts on your order as soon as it accepts it.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickSlots.map((slot) => (
              <Chip
                key={slot.hours}
                onClick={() => applyQuickSlot(slot.hours)}
              >
                {slot.label}
              </Chip>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="pickup-date"
                className="text-xs font-medium text-muted-foreground"
              >
                Date
              </label>
              <Input
                id="pickup-date"
                type="date"
                value={date}
                min={format(today, "yyyy-MM-dd")}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="pickup-time"
                className="text-xs font-medium text-muted-foreground"
              >
                Time
              </label>
              <Input
                id="pickup-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : (
            <p className="rounded-xl bg-muted p-3 text-center text-sm">
              <span className="text-muted-foreground">Collect at </span>
              <span className="font-semibold text-foreground">
                {format(new Date(`${date}T${time}`), "d MMM, h:mm a")}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
