import { Json } from "@/types/database.types"

export const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

export type DayKey = (typeof DAY_KEYS)[number]

export interface DayHours {
  open: string
  close: string
  closed: boolean
}

export type OperatingHours = Record<DayKey, DayHours>

export const DAY_LABELS: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

export const DAY_SHORT: Record<DayKey, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
}

export function defaultOperatingHours(): OperatingHours {
  return DAY_KEYS.reduce((acc, day) => {
    acc[day] = {
      open: "09:00",
      close: "21:00",
      closed: day === "sunday",
    }
    return acc
  }, {} as OperatingHours)
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Coerces whatever is stored in the JSONB column into a complete week. The
 * column predates this shape, so missing or malformed days fall back to the
 * default rather than crashing the settings screen.
 */
export function parseOperatingHours(value: Json | null): OperatingHours {
  const fallback = defaultOperatingHours()
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback
  }

  const source = value as Record<string, unknown>

  return DAY_KEYS.reduce((acc, day) => {
    const entry = source[day]
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      acc[day] = fallback[day]
      return acc
    }

    const record = entry as Record<string, unknown>
    const open = typeof record.open === "string" ? record.open : fallback[day].open
    const close =
      typeof record.close === "string" ? record.close : fallback[day].close

    acc[day] = {
      open: TIME_PATTERN.test(open) ? open : fallback[day].open,
      close: TIME_PATTERN.test(close) ? close : fallback[day].close,
      closed: record.closed === true,
    }
    return acc
  }, {} as OperatingHours)
}

/** "9:00 am – 9:00 pm", or "Closed". */
export function formatDayHours(hours: DayHours): string {
  if (hours.closed) return "Closed"
  return `${to12Hour(hours.open)} – ${to12Hour(hours.close)}`
}

function to12Hour(time: string): string {
  const [hourText, minute] = time.split(":")
  const hour = Number(hourText)
  const suffix = hour >= 12 ? "pm" : "am"
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${minute} ${suffix}`
}

/**
 * Whether the canteen should be serving right now per its schedule. Overnight
 * windows (e.g. 22:00–02:00) wrap past midnight, so they're checked as a union
 * of two ranges rather than a single comparison.
 */
export function isOpenNow(
  hours: OperatingHours,
  now = new Date()
): boolean {
  // getDay() is Sunday-first; DAY_KEYS is Monday-first.
  const index = (now.getDay() + 6) % 7
  const today = hours[DAY_KEYS[index]]
  if (!today || today.closed) return false

  const minutes = now.getHours() * 60 + now.getMinutes()
  const [openH, openM] = today.open.split(":").map(Number)
  const [closeH, closeM] = today.close.split(":").map(Number)
  const start = openH * 60 + openM
  const end = closeH * 60 + closeM

  if (end <= start) {
    return minutes >= start || minutes < end
  }
  return minutes >= start && minutes < end
}
