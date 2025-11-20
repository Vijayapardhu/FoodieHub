"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "@/types/database.types"
import { useMemo } from "react"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: { name: string } | null
}

interface PlatformAnalyticsProps {
  orders: Order[]
}

export function PlatformAnalytics({ orders }: PlatformAnalyticsProps) {
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, order) => sum + Number(order.total_amount), 0)

    const totalOrders = orders.length
    const completedOrders = orders.filter((o) => o.status === "completed").length

    // Revenue by canteen
    const canteenRevenue: Record<string, { name: string; revenue: number }> = {}
    orders
      .filter((o) => o.status === "completed")
      .forEach((order) => {
        const canteenName = order.canteens?.name || "Unknown"
        if (!canteenRevenue[canteenName]) {
          canteenRevenue[canteenName] = { name: canteenName, revenue: 0 }
        }
        canteenRevenue[canteenName].revenue += Number(order.total_amount)
      })

    const topCanteens = Object.values(canteenRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      topCanteens,
    }
  }, [orders])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{stats.totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Orders (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.completedOrders}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Canteens</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topCanteens.length === 0 ? (
            <p className="text-muted-foreground">No data available</p>
          ) : (
            <div className="space-y-2">
              {stats.topCanteens.map((canteen, index) => (
                <div
                  key={canteen.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="font-medium">{canteen.name}</span>
                  </div>
                  <span className="font-semibold">₹{canteen.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

