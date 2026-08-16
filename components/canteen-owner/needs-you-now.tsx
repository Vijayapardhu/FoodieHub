"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, BellRing, CheckCircle2, PackageCheck } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { useLiveQueue, type QueueOrder } from "@/lib/hooks/use-live-queue"
import { cn } from "@/lib/utils/cn"

/**
 * The one card the dashboard actually needs: is anything waiting on me?
 *
 * The rest of the dashboard reports on the past — yesterday's revenue, the
 * week's best sellers. Useful, but not what somebody opening the console at
 * 12:40 is looking for. This answers "does the kitchen need me right now",
 * live, and gets out of the way when the answer is no.
 */
export function NeedsYouNow({
  canteenId,
  initialOrders,
}: {
  canteenId: string
  initialOrders: QueueOrder[]
}) {
  const { orders } = useLiveQueue(canteenId, initialOrders, [
    "pending",
    "confirmed",
    "preparing",
    "ready",
  ])

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 20_000)
    return () => window.clearInterval(timer)
  }, [])

  const unaccepted = orders.filter(
    (order) => order.status === "pending" || order.status === "confirmed"
  )
  const cooking = orders.filter((order) => order.status === "preparing")
  const ready = orders.filter((order) => order.status === "ready")

  const waitedFor = (order: QueueOrder) =>
    Math.floor((now - new Date(order.created_at).getTime()) / 60000)

  // The oldest unaccepted order is the one someone is actively waiting on.
  const oldest = unaccepted.length
    ? Math.max(...unaccepted.map(waitedFor))
    : 0
  const urgent = oldest >= 5

  if (orders.length === 0) {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">All caught up</p>
          <p className="text-xs text-muted-foreground">
            Nothing waiting. New orders appear here the moment they arrive.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        "rounded-2xl border p-4",
        unaccepted.length > 0
          ? urgent
            ? "border-destructive/40 bg-destructive-soft"
            : "border-warning/40 bg-warning-soft"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            unaccepted.length > 0
              ? "bg-primary text-primary-foreground"
              : "bg-success-soft text-success"
          )}
        >
          {unaccepted.length > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <PackageCheck className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">
            {unaccepted.length > 0
              ? `${unaccepted.length} order${
                  unaccepted.length === 1 ? "" : "s"
                } waiting to be accepted`
              : "Nothing new — kitchen is on top of it"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {unaccepted.length > 0 ? (
              <>
                Oldest has waited{" "}
                <strong className="tabular-nums text-foreground">
                  {oldest} min
                </strong>
                {" · "}
              </>
            ) : null}
            {cooking.length} cooking · {ready.length} ready to collect
          </p>
        </div>

        <Button size="sm" asChild className="shrink-0">
          <Link href="/canteen/orders">
            Queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
