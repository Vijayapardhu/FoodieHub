import Link from "next/link"
import {
  IndianRupee,
  Store,
  TicketPercent,
  TriangleAlert,
  Users,
} from "@/components/ui/icons"
import { StatGrid, StatTile } from "@/components/ui/stat-tile"

interface AdminDashboardStatsProps {
  totalUsers: number
  totalCanteens: number
  activeCanteens: number
  pendingCanteens: number
  totalRevenue: number
  pendingPromotions: number
}

export function AdminDashboardStats({
  totalUsers,
  totalCanteens,
  activeCanteens,
  pendingCanteens,
  totalRevenue,
  pendingPromotions,
}: AdminDashboardStatsProps) {
  const tiles = [
    {
      href: "/admin/users",
      label: "Users",
      value: totalUsers.toLocaleString(),
      hint: "Registered accounts",
      icon: Users,
      tone: "info" as const,
    },
    {
      href: "/admin/canteens",
      label: "Canteens",
      value: totalCanteens.toLocaleString(),
      hint: `${activeCanteens} serving now`,
      icon: Store,
      tone: "primary" as const,
    },
    {
      href: "/admin/analytics",
      label: "Revenue (30d)",
      value: `₹${totalRevenue.toFixed(0)}`,
      hint: "Across all canteens",
      icon: IndianRupee,
      tone: "success" as const,
    },
    {
      href: "/admin/canteens",
      label: "Awaiting approval",
      value: pendingCanteens,
      hint: "Canteen registrations",
      icon: TriangleAlert,
      tone: pendingCanteens > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      href: "/admin/promotions",
      label: "Pending offers",
      value: pendingPromotions,
      hint: "Need a decision",
      icon: TicketPercent,
      tone: pendingPromotions > 0 ? ("warning" as const) : ("default" as const),
    },
  ]

  return (
    <StatGrid className="lg:grid-cols-5">
      {tiles.map((tile) => (
        <Link key={tile.label} href={tile.href} className="block">
          <StatTile
            label={tile.label}
            value={tile.value}
            hint={tile.hint}
            icon={tile.icon}
            tone={tile.tone}
            className="h-full transition-transform active:scale-[0.98] md:hover:shadow-lift"
          />
        </Link>
      ))}
    </StatGrid>
  )
}
