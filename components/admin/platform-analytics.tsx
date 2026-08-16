"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Download, IndianRupee, Receipt, Store, XCircle } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Chip, ChipRail } from "@/components/ui/chip"
import { StatGrid, StatTile } from "@/components/ui/stat-tile"
import { EmptyState } from "@/components/ui/empty-state"
import { datedFilename, downloadCsv } from "@/lib/utils/csv"
import { cn } from "@/lib/utils/cn"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: { name: string } | null
}

const ranges = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
] as const

export function PlatformAnalytics({ orders }: { orders: Order[] }) {
  const [days, setDays] = useState(30)

  const scoped = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return orders.filter((order) => new Date(order.created_at) >= cutoff)
  }, [orders, days])

  const stats = useMemo(() => {
    const completed = scoped.filter((order) => order.status === "completed")
    const revenue = completed.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0
    )

    const byCanteen = new Map<
      string,
      { name: string; revenue: number; orders: number }
    >()
    for (const order of completed) {
      const name = order.canteens?.name ?? "Unknown canteen"
      const entry = byCanteen.get(name) ?? { name, revenue: 0, orders: 0 }
      entry.revenue += Number(order.total_amount)
      entry.orders += 1
      byCanteen.set(name, entry)
    }

    // Daily series, oldest first, so the chart reads left to right.
    const daily: Array<{ label: string; value: number }> = []
    for (let offset = days - 1; offset >= 0; offset--) {
      const day = new Date()
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() - offset)
      const next = new Date(day)
      next.setDate(day.getDate() + 1)

      daily.push({
        label: format(day, "d MMM"),
        value: completed
          .filter((order) => {
            const created = new Date(order.created_at)
            return created >= day && created < next
          })
          .reduce((sum, order) => sum + Number(order.total_amount), 0),
      })
    }

    return {
      revenue,
      orderCount: scoped.length,
      completedCount: completed.length,
      cancelledCount: scoped.filter((o) => o.status === "cancelled").length,
      topCanteens: Array.from(byCanteen.values()).sort(
        (a, b) => b.revenue - a.revenue
      ),
      daily,
    }
  }, [scoped, days])

  const exportRevenue = () => {
    downloadCsv(datedFilename(`platform-revenue-${days}d`), stats.topCanteens, [
      { header: "Canteen", value: (row) => row.name },
      { header: "Completed orders", value: (row) => row.orders },
      { header: "Revenue (INR)", value: (row) => row.revenue.toFixed(2) },
    ])
  }

  const exportDaily = () => {
    downloadCsv(datedFilename(`platform-daily-${days}d`), stats.daily, [
      { header: "Date", value: (row) => row.label },
      { header: "Revenue (INR)", value: (row) => row.value.toFixed(2) },
    ])
  }

  const dailyMax = Math.max(...stats.daily.map((d) => d.value), 1)
  const topMax = stats.topCanteens[0]?.revenue ?? 1

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
            onClick={exportRevenue}
            disabled={stats.topCanteens.length === 0}
          >
            <Download className="h-4 w-4" />
            By canteen
          </Button>
          <Button variant="outline" size="sm" onClick={exportDaily}>
            <Download className="h-4 w-4" />
            Daily
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
          label="Active canteens"
          value={stats.topCanteens.length}
          hint="With sales in this period"
          icon={Store}
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

      <Card>
        <CardHeader>
          <CardTitle>Daily revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex h-36 items-end gap-0.5"
            role="img"
            aria-label={`Revenue over the last ${days} days`}
          >
            {stats.daily.map((day, index) => (
              <div
                key={`${day.label}-${index}`}
                className="flex h-full flex-1 items-end"
                title={`${day.label}: ₹${day.value.toFixed(0)}`}
              >
                <div
                  className={cn(
                    "w-full rounded-t-sm",
                    day.value === dailyMax && day.value > 0
                      ? "bg-primary"
                      : "bg-primary/35"
                  )}
                  style={{
                    height: `${Math.max((day.value / dailyMax) * 100, 2)}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-2xs text-muted-foreground">
            <span>{stats.daily[0]?.label}</span>
            <span>{stats.daily[stats.daily.length - 1]?.label}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by canteen</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topCanteens.length === 0 ? (
            <EmptyState
              title="No completed orders yet"
              description="Pick a longer range, or wait for the first collection."
              compact
            />
          ) : (
            <ol className="space-y-2.5">
              {stats.topCanteens.slice(0, 10).map((canteen, index) => (
                <li key={canteen.name} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
                    {index + 1}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {canteen.name}
                    </span>
                    <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{
                          width: `${(canteen.revenue / topMax) * 100}%`,
                        }}
                      />
                    </span>
                  </span>

                  <span className="shrink-0 text-right text-xs">
                    <span className="block font-bold tabular-nums text-foreground">
                      ₹{canteen.revenue.toFixed(0)}
                    </span>
                    <span className="block tabular-nums text-muted-foreground">
                      {canteen.orders} orders
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
