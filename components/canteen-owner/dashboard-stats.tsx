import { IndianRupee, Receipt, Star, TrendingUp } from "@/components/ui/icons"
import { StatGrid, StatTile } from "@/components/ui/stat-tile"

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
  return (
    <StatGrid>
      <StatTile
        label="Revenue today"
        value={`₹${metrics.todayRevenue.toFixed(0)}`}
        delta={metrics.revenueDelta}
        hint="vs yesterday"
        icon={IndianRupee}
        tone="success"
      />
      <StatTile
        label="Active orders"
        value={metrics.activeOrders}
        hint={`${metrics.readyOrders} ready to collect`}
        icon={Receipt}
        tone="primary"
      />
      <StatTile
        label="Avg. ticket"
        value={`₹${metrics.avgTicket.toFixed(0)}`}
        hint="Last 7 days"
        icon={TrendingUp}
        tone="info"
      />
      <StatTile
        label="Rating"
        value={metrics.rating.toFixed(1)}
        hint="Out of 5"
        icon={Star}
        tone="warning"
      />
    </StatGrid>
  )
}
