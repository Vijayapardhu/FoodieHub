import type { OrderStatus } from "@/lib/utils/order-status"

export interface EtaSource {
  created_at: string
  status: string
  estimated_preparation_time?: number | null
  scheduled_pickup_time?: string | null
}

export type EtaState =
  | { kind: "ready" }
  | { kind: "scheduled"; at: Date; minutes: number }
  | { kind: "counting"; at: Date; minutes: number }
  | { kind: "overdue"; at: Date; minutes: number }
  | { kind: "finished" }
  | { kind: "unknown" }

/**
 * When this order should be collectable.
 *
 * A scheduled order is answered by its own pickup time; everything else is
 * placed-at plus the kitchen's prep estimate. `overdue` is deliberately a
 * distinct state rather than a negative countdown — "ready 6 minutes ago" and
 * "−6 min" read very differently to somebody standing at a counter.
 */
export function orderEta(order: EtaSource, now: Date = new Date()): EtaState {
  const status = order.status as OrderStatus

  if (status === "ready") return { kind: "ready" }
  if (status === "completed" || status === "cancelled") return { kind: "finished" }

  if (order.scheduled_pickup_time) {
    const at = new Date(order.scheduled_pickup_time)
    return {
      kind: "scheduled",
      at,
      minutes: Math.round((at.getTime() - now.getTime()) / 60000),
    }
  }

  const minutesAllowed = order.estimated_preparation_time
  if (!minutesAllowed) return { kind: "unknown" }

  const at = new Date(
    new Date(order.created_at).getTime() + minutesAllowed * 60000
  )
  const minutes = Math.round((at.getTime() - now.getTime()) / 60000)

  return minutes < 0
    ? { kind: "overdue", at, minutes: Math.abs(minutes) }
    : { kind: "counting", at, minutes }
}

function clock(at: Date) {
  return at.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  })
}

/** Short form for a card or a list row. */
export function etaLabel(state: EtaState): string | null {
  switch (state.kind) {
    case "ready":
      return "Ready now"
    case "scheduled":
      return state.minutes > 90
        ? `Pickup at ${clock(state.at)}`
        : `Pickup in ${Math.max(0, state.minutes)} min`
    case "counting":
      // Beyond an hour a clock time is easier to hold in your head than a
      // three-digit countdown.
      return state.minutes > 60
        ? `Ready by ${clock(state.at)}`
        : `Ready in ~${Math.max(1, state.minutes)} min`
    case "overdue":
      return "Taking longer than usual"
    default:
      return null
  }
}

/** Longer form for the tracking screen, where there is room to explain. */
export function etaDetail(state: EtaState): string | null {
  switch (state.kind) {
    case "ready":
      return "Show your token at the counter"
    case "scheduled":
      return `Booked for ${clock(state.at)}`
    case "counting":
      return `Usually ready by ${clock(state.at)}`
    case "overdue":
      return "The kitchen is behind its usual time — it will update as soon as it's ready"
    default:
      return null
  }
}
