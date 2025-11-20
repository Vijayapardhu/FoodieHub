"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "@/types/database.types"
import { useMemo } from "react"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"] | null
    }
  >
}

interface AnalyticsDashboardProps {
  orders: Order[]
}

export function AnalyticsDashboard({ orders }: AnalyticsDashboardProps) {
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, order) => sum + Number(order.total_amount), 0)

    const totalOrders = orders.length
    const completedOrders = orders.filter((o) => o.status === "completed").length

    // Popular items
    const itemCounts: Record<string, { name: string; count: number }> = {}
    orders.forEach((order) => {
      order.order_items.forEach((item) => {
        const itemName = item.items?.name || "Unknown"
        if (!itemCounts[itemName]) {
          itemCounts[itemName] = { name: itemName, count: 0 }
        }
        itemCounts[itemName].count += item.quantity
      })
    })

    const popularItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      popularItems,
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
          <CardTitle>Popular Items</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.popularItems.length === 0 ? (
            <p className="text-muted-foreground">No data available</p>
          ) : (
            <div className="space-y-2">
              {stats.popularItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.count} orders</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

