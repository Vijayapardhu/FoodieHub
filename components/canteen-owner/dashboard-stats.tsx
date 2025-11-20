import { Card, CardContent } from "@/components/ui/card"
import {
  DollarSign,
  ShoppingBag,
  Star,
  Package,
  TrendingUp,
  GaugeCircle,
} from "lucide-react"

interface DashboardStatsProps {
  metrics: {
    todayRevenue: number
    revenueDelta: number
    activeOrders: number
    readyOrders: number
    rating: number
    avgTicket: number
  }
}

export function DashboardStats({ metrics }: DashboardStatsProps) {
  const stats = [
    {
      label: "Today's Revenue",
      value: `₹${metrics.todayRevenue.toFixed(0)}`,
      helper: `${metrics.revenueDelta >= 0 ? "+" : ""}${metrics.revenueDelta.toFixed(
        1
      )}% vs yesterday`,
      icon: DollarSign,
      accent: "text-green-600",
    },
    {
      label: "Active Orders",
      value: metrics.activeOrders.toString(),
      helper: `${metrics.readyOrders} ready for pickup`,
      icon: ShoppingBag,
      accent: "text-blue-600",
    },
    {
      label: "Average Ticket",
      value: `₹${metrics.avgTicket.toFixed(0)}`,
      helper: "Per completed order (7d)",
      icon: TrendingUp,
      accent: "text-orange-600",
    },
    {
      label: "Rating",
      value: metrics.rating.toFixed(1),
      helper: "Student satisfaction",
      icon: Star,
      accent: "text-yellow-500",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-orange-50 bg-white/90 shadow-sm">
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                </div>
                <div className="rounded-full bg-orange-50 p-3">
                  <Icon className={`h-6 w-6 ${stat.accent}`} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{stat.helper}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

