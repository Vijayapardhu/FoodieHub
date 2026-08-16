"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  ChefHat,
  Clock,
  Inbox,
  PackageCheck,
  Volume2,
  VolumeX,
} from "lucide-react"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLiveQueue, type QueueOrder } from "@/lib/hooks/use-live-queue"
import { ownerOrderPath } from "@/lib/utils/public-id"
import { cn } from "@/lib/utils/cn"

const DECLINE_REASONS = [
  "Sold out of an item",
  "Kitchen is closing",
  "Too busy to take this on",
  "Can't make it in time",
]

/** The three things a kitchen does, in the order it does them. */
const COLUMNS = [
  {
    key: "pending" as const,
    title: "New",
    hint: "Accept or decline",
    icon: Inbox,
    next: "preparing" as const,
    advance: "Accept & cook",
    accent: "border-warning/40 bg-warning-soft",
  },
  {
    key: "preparing" as const,
    title: "Cooking",
    hint: "On the stove",
    icon: ChefHat,
    next: "ready" as const,
    advance: "Mark ready",
    accent: "border-info/40 bg-info-soft",
  },
  {
    key: "ready" as const,
    title: "Ready",
    hint: "Waiting at the counter",
    icon: PackageCheck,
    next: "completed" as const,
    advance: "Handed over",
    accent: "border-success/40 bg-success-soft",
  },
]

const SOUND_KEY = "foodiehub.queue-sound"

/**
 * When the kitchen should start on this order.
 *
 * For a walk-up order that is the moment it was placed. For a booking it is
 * one prep-time before the pickup slot — starting a 1pm thali at 9am is how
 * food gets cold.
 */
function startsAt(order: QueueOrder) {
  const placed = new Date(order.created_at).getTime()
  if (!order.scheduled_pickup_time) return placed

  const pickup = new Date(order.scheduled_pickup_time).getTime()
  const prep = (order.estimated_preparation_time ?? 20) * 60000
  return Math.max(placed, pickup - prep)
}

/** An order booked for later that the kitchen should not have started yet. */
function isUpcoming(order: QueueOrder, now: number) {
  return Boolean(order.scheduled_pickup_time) && startsAt(order) > now
}

/** Minutes the kitchen has had this order in front of it. */
function waitedMinutes(order: QueueOrder, now: number) {
  return Math.max(0, Math.floor((now - startsAt(order)) / 60000))
}

/**
 * How urgent this order is, from how long it has been waiting against what
 * the customer was promised. This is the whole point of the screen: at a
 * glance, which ticket is closest to letting somebody down.
 */
function urgency(order: QueueOrder, now: number) {
  const waited = waitedMinutes(order, now)
  const promised = order.estimated_preparation_time ?? 20
  if (waited >= promised) return "late" as const
  if (waited >= promised * 0.7) return "soon" as const
  return "fine" as const
}

export function KitchenQueue({
  canteenId,
  initialOrders,
}: {
  canteenId: string
  initialOrders: QueueOrder[]
}) {
  const router = useRouter()
  const statuses = useMemo(
    () => ["pending", "confirmed", "preparing", "ready"],
    []
  )
  const { orders, refresh, arrived } = useLiveQueue(
    canteenId,
    initialOrders,
    statuses
  )

  const [busyId, setBusyId] = useState<string | null>(null)
  const [declineTarget, setDeclineTarget] = useState<QueueOrder | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [declining, setDeclining] = useState(false)
  const [soundOn, setSoundOn] = useState(false)

  // Re-render on a timer so the waiting clocks actually tick.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 20_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setSoundOn(window.localStorage.getItem(SOUND_KEY) === "1")
  }, [])

  /**
   * A chime for a new order, synthesised rather than shipped as an audio file
   * — it needs no asset, no network, and no decode delay when the kitchen is
   * busy. Off by default: browsers block audio until the page is interacted
   * with, and a counter tablet that beeps unbidden is worse than silence.
   */
  const audioRef = useRef<AudioContext | null>(null)
  const lastArrived = useRef(arrived)

  useEffect(() => {
    if (arrived === lastArrived.current) return
    lastArrived.current = arrived
    if (!soundOn) return

    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      const ctx = (audioRef.current ??= new Ctx())
      const now = ctx.currentTime

      // Two short rising notes — recognisable across a noisy kitchen without
      // being an alarm.
      ;[880, 1174].forEach((frequency, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = frequency
        osc.type = "sine"
        gain.gain.setValueAtTime(0.0001, now + index * 0.18)
        gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.18 + 0.02)
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + index * 0.18 + 0.16
        )
        osc.connect(gain).connect(ctx.destination)
        osc.start(now + index * 0.18)
        osc.stop(now + index * 0.18 + 0.18)
      })
    } catch {
      // An unavailable audio context is not worth surfacing.
    }

    if ("vibrate" in navigator) navigator.vibrate?.([40, 60, 40])
  }, [arrived, soundOn])

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    window.localStorage.setItem(SOUND_KEY, next ? "1" : "0")
    if (next) toast.success("You'll hear new orders")
  }

  const setStatus = async (order: QueueOrder, status: string) => {
    setBusyId(order.id)
    try {
      const { error } = await createClient()
        .from("orders")
        .update({ status })
        .eq("id", order.id)
      if (error) throw error

      await refresh()
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update that order")
    } finally {
      setBusyId(null)
    }
  }

  const decline = async () => {
    if (!declineTarget) return
    const reason = declineReason.trim()
    if (!reason) {
      toast.error("Say why, so the customer isn't left guessing")
      return
    }

    setDeclining(true)
    try {
      const { error } = await createClient()
        .from("orders")
        .update({ status: "cancelled", decline_reason: reason })
        .eq("id", declineTarget.id)
      if (error) throw error

      toast.success(`#${declineTarget.token} declined — customer told why`)
      setDeclineTarget(null)
      setDeclineReason("")
      await refresh()
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not decline that order")
    } finally {
      setDeclining(false)
    }
  }

  /*
   * Bookings for later are held back from the board entirely.
   *
   * Scheduling allows a week ahead, so without this a Tuesday order sat in
   * "New" from the moment it was placed, ageing against a clock that had not
   * started, turning red, and burying the orders the kitchen actually has to
   * cook today.
   */
  const upcoming = useMemo(
    () =>
      orders
        .filter((order) => isUpcoming(order, now) && order.status !== "ready")
        .sort(
          (a, b) =>
            new Date(a.scheduled_pickup_time!).getTime() -
            new Date(b.scheduled_pickup_time!).getTime()
        ),
    [orders, now]
  )

  // `confirmed` is a state the customer app can produce but the kitchen has no
  // separate step for, so it sits with the new orders rather than vanishing.
  const byColumn = useMemo(() => {
    const map: Record<string, QueueOrder[]> = {
      pending: [],
      preparing: [],
      ready: [],
    }
    for (const order of orders) {
      if (isUpcoming(order, now) && order.status !== "ready") continue
      if (order.status === "pending" || order.status === "confirmed") {
        map.pending.push(order)
      } else if (map[order.status]) {
        map[order.status].push(order)
      }
    }
    return map
  }, [orders, now])

  /**
   * What the kitchen has to cook in total, across every unfinished order.
   *
   * Six dosas on one tawa beats six trips to the tawa, and until now the only
   * way to know there were six was to open six orders and add them up.
   */
  const prepTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const order of orders) {
      if (order.status === "ready") continue
      if (isUpcoming(order, now)) continue
      for (const line of order.lines) {
        totals.set(line.name, (totals.get(line.name) ?? 0) + line.quantity)
      }
    }
    return Array.from(totals, ([name, quantity]) => ({ name, quantity })).sort(
      (a, b) => b.quantity - a.quantity
    )
  }, [orders, now])

  const lateCount = orders.filter(
    (order) =>
      order.status !== "ready" &&
      !isUpcoming(order, now) &&
      urgency(order, now) === "late"
  ).length

  const OrderCard = ({
    order,
    column,
  }: {
    order: QueueOrder
    column: (typeof COLUMNS)[number]
  }) => {
    const level = urgency(order, now)
    const waited = waitedMinutes(order, now)
    const customer =
      order.customer_name || order.users?.full_name || "Guest"

    return (
      <li
        className={cn(
          "overflow-hidden rounded-2xl border bg-card",
          level === "late" && order.status !== "ready"
            ? "border-destructive/50 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)]"
            : "border-border"
        )}
      >
        <Link
          href={ownerOrderPath(order)}
          className="block p-3 transition-colors active:bg-muted"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-lg font-black tracking-wider text-foreground">
              {order.token}
            </span>

            {/* The clock is the most important number on the card. */}
            <span
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold tabular-nums",
                level === "late"
                  ? "bg-destructive text-destructive-foreground"
                  : level === "soon"
                    ? "bg-warning-soft text-warning"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <Clock className="h-3 w-3" />
              {waited}m
            </span>
          </div>

          {/* What to cook, not who ordered it — the kitchen reads this first. */}
          <ul className="mt-2 space-y-0.5">
            {order.lines.map((line, index) => (
              <li key={index} className="text-sm text-foreground">
                <span className="font-bold tabular-nums">{line.quantity}×</span>{" "}
                {line.name}
              </li>
            ))}
          </ul>

          <p className="mt-1.5 truncate text-xs text-muted-foreground">
            {customer} · ₹{Number(order.total_amount).toFixed(0)}
          </p>

          {order.special_instructions ? (
            <p className="mt-2 rounded-lg bg-warning-soft px-2 py-1 text-xs text-warning">
              {order.special_instructions}
            </p>
          ) : null}

          {order.dietary_notes ? (
            <p className="mt-1.5 rounded-lg bg-destructive-soft px-2 py-1 text-xs font-semibold text-destructive">
              {order.dietary_notes}
            </p>
          ) : null}
        </Link>

        <div className="flex gap-2 border-t border-border p-2.5">
          {/* Food was cooked and nobody came. Distinct from a cancellation:
              the kitchen bore the cost, and that is worth recording. */}
          {order.status === "ready" ? (
            <Button
              variant="outline"
              size="sm"
              className="border-warning/50 text-warning hover:bg-warning-soft"
              loading={busyId === order.id}
              onClick={() => setStatus(order, "no_show")}
            >
              No-show
            </Button>
          ) : null}

          {order.status === "pending" || order.status === "confirmed" ? (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive-soft"
              onClick={() => setDeclineTarget(order)}
              disabled={busyId === order.id}
            >
              Decline
            </Button>
          ) : null}
          <Button
            size="sm"
            className="flex-1"
            loading={busyId === order.id}
            onClick={() => setStatus(order, column.next)}
          >
            {column.advance}
          </Button>
        </div>
      </li>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Status strip: what needs attention, and the sound switch. */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Live
          </span>

          <span className="text-sm text-muted-foreground">
            {orders.length - upcoming.length} in the queue
          </span>

          {upcoming.length > 0 ? (
            <span className="rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">
              {upcoming.length} booked for later
            </span>
          ) : null}

          {lateCount > 0 ? (
            <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">
              {lateCount} running late
            </span>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={toggleSound}
            aria-pressed={soundOn}
          >
            {soundOn ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            {soundOn ? "Sound on" : "Sound off"}
          </Button>
        </div>

        {/* Batch view: everything the kitchen still has to make. */}
        {prepTotals.length > 0 ? (
          <section className="rounded-2xl border border-border bg-surface-muted p-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Still to cook
            </h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {prepTotals.map((total) => (
                <li
                  key={total.name}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-sm"
                >
                  <span className="font-bold tabular-nums text-primary">
                    {total.quantity}×
                  </span>{" "}
                  <span className="text-foreground">{total.name}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Bookings, listed but out of the way. They join the board on their
            own when there is just enough time left to cook them. */}
        {upcoming.length > 0 ? (
          <section className="rounded-2xl border border-info/30 bg-info-soft p-3">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-info">
              <CalendarClock className="h-3.5 w-3.5" />
              Booked for later
            </h2>
            <ul className="mt-2 space-y-1.5">
              {upcoming.map((order) => (
                <li key={order.id}>
                  <Link
                    href={ownerOrderPath(order)}
                    className="flex items-center gap-3 rounded-xl bg-card px-3 py-2 transition-colors active:bg-muted"
                  >
                    <span className="font-mono text-sm font-bold text-foreground">
                      {order.token}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                      {order.lines
                        .map((line) => `${line.quantity}x ${line.name}`)
                        .join(", ")}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-info">
                      {new Date(order.scheduled_pickup_time!).toLocaleString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {orders.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nothing waiting"
            description="New orders appear here the moment a student checks out — no need to refresh."
          />
        ) : orders.length === upcoming.length ? (
          <EmptyState
            icon={Inbox}
            title="Nothing to cook right now"
            description="Everything in the queue is booked for later. It moves up here when it's time to start."
            compact
          />
        ) : (
          /* Three columns on a counter tablet, stacked sections on a phone. */
          <div className="grid gap-4 lg:grid-cols-3">
            {COLUMNS.map((column) => {
              const list = byColumn[column.key] ?? []
              const Icon = column.icon

              return (
                <section key={column.key} className="space-y-2">
                  <header
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2",
                      column.accent
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <h2 className="text-sm font-bold text-foreground">
                      {column.title}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {column.hint}
                    </span>
                    <span className="ml-auto text-sm font-black tabular-nums text-foreground">
                      {list.length}
                    </span>
                  </header>

                  {list.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      Nothing here
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {list.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          column={column}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>

      <Dialog
        open={declineTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeclineTarget(null)
            setDeclineReason("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline #{declineTarget?.token}?</DialogTitle>
            <DialogDescription>
              The customer is told immediately, in your words. Nothing was
              paid, so there is nothing to refund.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-1">
            <div className="flex flex-wrap gap-2">
              {DECLINE_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setDeclineReason(reason)}
                  className={
                    declineReason === reason
                      ? "rounded-full border border-primary bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
                      : "rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                  }
                >
                  {reason}
                </button>
              ))}
            </div>

            <Input
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Or write your own"
              aria-label="Reason for declining"
              maxLength={140}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setDeclineTarget(null)}
              disabled={declining}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              block
              loading={declining}
              disabled={!declineReason.trim()}
              onClick={decline}
            >
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
