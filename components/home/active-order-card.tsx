"use client"

import Link from "next/link"
import { ChevronRight } from "@/components/ui/icons"
import { orderPath } from "@/lib/utils/public-id"
import { statusMeta, type OrderStatus } from "@/lib/utils/order-status"
import { etaLabel, orderEta } from "@/lib/utils/eta"
import { cn } from "@/lib/utils/cn"

export interface ActiveOrder {
  id: string
  token: string
  status: OrderStatus
  canteenName: string
  itemCount: number
  createdAt: string
  prepMinutes: number | null
  scheduledFor: string | null
}

/**
 * Live order banner, pinned to the top of the home screen.
 *
 * If somebody has food being cooked right now, that is the single most useful
 * thing the app can show them — they opened it to check on that, not to
 * browse. Before this the only route to a live order was Orders → find it in
 * the list, which on a phone is three taps and a scan of a list.
 */
export function ActiveOrderCard({ order }: { order: ActiveOrder }) {
  const meta = statusMeta(order.status)
  const ready = order.status === "ready"
  const etaText = etaLabel(
    orderEta({
      created_at: order.createdAt,
      status: order.status,
      estimated_preparation_time: order.prepMinutes,
      scheduled_pickup_time: order.scheduledFor,
    })
  )

  return (
    <Link
      href={orderPath(order)}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3.5 transition-transform active:scale-[0.99]",
        ready
          ? "border-success bg-success-soft"
          : "border-primary/25 bg-primary-soft"
      )}
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
        {/* A pulse only while the kitchen is actually doing something. */}
        {!ready ? (
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
        ) : null}
        <span
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-black",
            ready
              ? "bg-success text-success-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          {order.token.slice(0, 2)}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm font-bold",
            ready ? "text-success" : "text-primary"
          )}
        >
          {ready ? "Ready to collect" : meta.customerHint}
        </span>
        <span className="mt-0.5 block truncate text-sm text-foreground">
          {order.canteenName} · {order.itemCount}{" "}
          {order.itemCount === 1 ? "item" : "items"}
          {etaText && !ready ? ` · ${etaText}` : ""}
        </span>
        <span className="block font-mono text-xs font-bold tracking-wider text-muted-foreground">
          Token {order.token}
        </span>
      </span>

      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}
