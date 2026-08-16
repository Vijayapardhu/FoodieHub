"use client"

import { useMemo, useState } from "react"
import { Download, IndianRupee, Receipt, TrendingUp, XCircle } from "lucide-react"
import { format } from "date-fns"
import { Database } from "@/types/database.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Chip, ChipRail } from "@/components/ui/chip"
import { StatGrid, StatTile } from "@/components/ui/stat-tile"
import { EmptyState } from "@/components/ui/empty-state"
import { datedFilename, downloadCsv } from "@/lib/utils/csv"
import { cn } from "@/lib/utils/cn"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"] | null
    }
  >
}

const ranges = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
] as const

export function AnalyticsDashboard({ orders }: { orders: Order[] }) {
  const [days, setDays] = useState<number>(30)

  const scoped = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return orders.filter((order) => new Date(order.created_at) >= cutoff)
  }, [orders, days])

  const stats = useMemo(() => {
    const completed = scoped.filter((order) => order.status === "completed")
    const cancelled = scoped.filter((order) => order.status === "cancelled")
    const noShows = scoped.filter((order) => order.status === "no_show")

    /*
     * Food cooked and binned. Distinct from a cancellation, where nothing was
     * made — this is the only line in the console that represents a direct
     * loss to the kitchen.
     */
    const wasted = noShows.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0
    )

    /*
     * Did the app tell the truth about the wait?
     *
     * Compares what each collected order was quoted against how long it
     * actually took. An owner cannot tune prep times without this — and the
     * quoted number is a promise the app makes on their behalf.
     */
    const timed = completed.filter(
      (order) => order.collected_at && order.estimated_preparation_time
    )
    const actuals = timed.map((order) =>
      Math.round(
        (new Date(order.collected_at as string).getTime() -
          new Date(order.created_at).getTime()) /
          60000
      )
    )
    const quoted = timed.map(
      (order) => order.estimated_preparation_time as number
    )
    const avgActual = actuals.length
      ? actuals.reduce((a, b) => a + b, 0) / actuals.length
      : null
    const avgQuoted = quoted.length
      ? quoted.reduce((a, b) => a + b, 0) / quoted.length
      : null
    const onTime = timed.filter(
      (_, i) => actuals[i] <= quoted[i]
    ).length

    // Why the kitchen turned work away, in its own words.
    const declineReasons = new Map<string, number>()
    for (const order of scoped) {
      const reason = (order as any).decline_reason as string | null
      if (!reason) continue
      declineReasons.set(reason, (declineReasons.get(reason) ?? 0) + 1)
    }
    const declines = Array.from(declineReasons, ([reason, count]) => ({
      reason,
      count,
    })).sort((a, b) => b.count - a.count)
    const revenue = completed.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0
    )

    const itemCounts = new Map<string, { name: string; count: number; revenue: number }>()

    for (const order of scoped) {
      for (const line of order.order_items ?? []) {
        const name = line.items?.name ?? "Unknown item"
        const entry = itemCounts.get(name) ?? { name, count: 0, revenue: 0 }
        entry.count += line.quantity
        entry.revenue += Number(line.price) * line.quantity
        itemCounts.set(name, entry)
      }
    }

    // Peak hours tell an owner when to roster extra hands.
    const byHour = new Array(24).fill(0)
    for (const order of scoped) {
      byHour[new Date(order.created_at).getHours()] += 1
    }

    return {
      noShowCount: noShows.length,
      wasted,
      avgActual,
      avgQuoted,
      onTime,
      timedCount: timed.length,
      declines,
      revenue,
      orderCount: scoped.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      avgTicket: completed.length > 0 ? revenue / completed.length : 0,
      popularItems: Array.from(itemCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      byHour,
    }
  }, [scoped])

  const exportOrders = () => {
    downloadCsv(datedFilename(`orders-last-${days}-days`), scoped, [
      { header: "Token", value: (o) => o.token },
      {
        header: "Placed at",
        value: (o) => format(new Date(o.created_at), "yyyy-MM-dd HH:mm"),
      },
      { header: "Customer", value: (o) => o.customer_name ?? "" },
      { header: "Phone", value: (o) => o.customer_phone ?? "" },
      { header: "Status", value: (o) => o.status },
      { header: "Payment status", value: (o) => o.payment_status },
      {
        header: "Items",
        value: (o) =>
          (o.order_items ?? [])
            .map((line) => `${line.items?.name ?? "Item"} x${line.quantity}`)
            .join("; "),
      },
      { header: "Total (INR)", value: (o) => Number(o.total_amount).toFixed(2) },
    ])
  }

  const exportItems = () => {
    downloadCsv(datedFilename(`item-sales-last-${days}-days`), stats.popularItems, [
      { header: "Item", value: (row) => row.name },
      { header: "Units sold", value: (row) => row.count },
      { header: "Revenue (INR)", value: (row) => row.revenue.toFixed(2) },
    ])
  }

  const peakHourMax = Math.max(...stats.byHour, 1)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChipRail className="flex-1">
          {ranges.map((range) => (
            <Chip
              key={range.days}
              active={days === range.days}
              onClick={() => setDays(range.days)}
            >
              {range.label}
            </Chip>
          ))}
        </ChipRail>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportOrders}
            disabled={scoped.length === 0}
          >
            <Download className="h-4 w-4" />
            Orders CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportItems}
            disabled={stats.popularItems.length === 0}
          >
            <Download className="h-4 w-4" />
            Items CSV
          </Button>
        </div>
      </div>

      <StatGrid>
        <StatTile
          label="Revenue"
          value={`₹${stats.revenue.toFixed(0)}`}
          hint="Collected orders"
          icon={IndianRupee}
          tone="success"
        />
        <StatTile
          label="Orders"
          value={stats.orderCount}
          hint={`${stats.completedCount} completed`}
          icon={Receipt}
          tone="primary"
        />
        <StatTile
          label="Avg. ticket"
          value={`₹${stats.avgTicket.toFixed(0)}`}
          hint="Per collected order"
          icon={TrendingUp}
          tone="info"
        />
        <StatTile
          label="Not collected"
          value={stats.noShowCount}
          hint={
            stats.wasted > 0
              ? `₹${stats.wasted.toFixed(0)} of food binned`
              : `${stats.cancelledCount} cancelled before cooking`
          }
          icon={XCircle}
          tone={stats.noShowCount > 0 ? "destructive" : "default"}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Were you on time?</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.timedCount === 0 ? (
              <EmptyState
                title="Nothing collected yet in this period"
                description="Once orders are handed over, this compares how long they really took against what the app promised."
                compact
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black tabular-nums text-foreground">
                    {Math.round(
                      (stats.onTime / stats.timedCount) * 100
                    )}
                    %
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {stats.timedCount} orders ready by the time promised
                  </span>
                </div>

                <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">You quote</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {stats.avgQuoted?.toFixed(0)} min
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">You actually take</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {stats.avgActual?.toFixed(0)} min
                    </dd>
                  </div>
                </dl>

                {stats.avgActual !== null && stats.avgQuoted !== null ? (
                  <p
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs",
                      stats.avgActual > stats.avgQuoted + 3
                        ? "bg-warning-soft text-warning"
                        : "bg-success-soft text-success"
                    )}
                  >
                    {stats.avgActual > stats.avgQuoted + 3
                      ? `You are running about ${Math.round(stats.avgActual - stats.avgQuoted)} minutes over. Raising your prep time would make the promise honest.`
                      : "Your prep times match reality. Students are being told the truth."}
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why you turned orders away</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.declines.length === 0 ? (
              <EmptyState
                title="You declined nothing"
                description="Reasons appear here when you decline an order, so patterns are visible."
                compact
              />
            ) : (
              <ul className="space-y-2">
                {stats.declines.map((entry) => (
                  <li
                    key={entry.reason}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {entry.reason}
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-muted-foreground">
                      {entry.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Best sellers</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.popularItems.length === 0 ? (
              <EmptyState
                title="No sales in this period"
                description="Pick a longer range, or wait for the next order."
                compact
              />
            ) : (
              <ol className="space-y-2.5">
                {stats.popularItems.map((item, index) => (
                  <li key={item.name} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {item.name}
                      </span>
                      <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{
                            width: `${
                              (item.count / stats.popularItems[0].count) * 100
                            }%`,
                          }}
                        />
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs">
                      <span className="block font-bold tabular-nums text-foreground">
                        {item.count}
                      </span>
                      <span className="block tabular-nums text-muted-foreground">
                        ₹{item.revenue.toFixed(0)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Busiest hours</CardTitle>
            <p className="text-sm text-muted-foreground">
              Orders received, by hour of day
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-end gap-px">
              {stats.byHour.map((count, hour) => (
                <div
                  key={hour}
                  className="group relative flex h-full flex-1 items-end"
                  title={`${hour}:00 — ${count} orders`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t-sm",
                      count === peakHourMax && count > 0
                        ? "bg-primary"
                        : "bg-primary/30"
                    )}
                    style={{ height: `${Math.max((count / peakHourMax) * 100, 2)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-2xs text-muted-foreground">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>11pm</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
