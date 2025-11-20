import { Card, CardContent } from "@/components/ui/card"
import { Users, Store, DollarSign, Gift } from "lucide-react"
import Link from "next/link"

interface AdminDashboardStatsProps {
  totalUsers: number
  totalCanteens: number
  activeCanteens: number
  totalRevenue: number
  pendingPromotions: number
}

export function AdminDashboardStats({
  totalUsers,
  totalCanteens,
  activeCanteens,
  totalRevenue,
  pendingPromotions,
}: AdminDashboardStatsProps) {
  const stats = [
    {
      label: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      href: "/admin/users",
    },
    {
      label: "Total Canteens",
      value: totalCanteens.toLocaleString(),
      icon: Store,
      color: "text-green-600",
      href: "/admin/canteens",
    },
    {
      label: "Active Canteens",
      value: activeCanteens.toLocaleString(),
      icon: Store,
      color: "text-orange-600",
      href: "/admin/canteens",
    },
    {
      label: "Revenue (30 days)",
      value: `₹${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-purple-600",
      href: "/admin/analytics",
    },
    {
      label: "Pending Promotions",
      value: pendingPromotions.toString(),
      icon: Gift,
      color: "text-yellow-600",
      href: "/admin/promotions",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon
        const content = (
          <Card className="transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        )

        if (stat.href) {
          return (
            <Link key={stat.label} href={stat.href}>
              {content}
            </Link>
          )
        }

        return <div key={stat.label}>{content}</div>
      })}
    </div>
  )
}

