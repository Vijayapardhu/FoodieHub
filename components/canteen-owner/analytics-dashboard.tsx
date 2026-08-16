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
          label="Cancelled"
          value={stats.cancelledCount}
          hint={
            stats.orderCount > 0
              ? `${((stats.cancelledCount / stats.orderCount) * 100).toFixed(0)}% of orders`
              : "None"
          }
          icon={XCircle}
          tone="destructive"
        />
      </StatGrid>

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
