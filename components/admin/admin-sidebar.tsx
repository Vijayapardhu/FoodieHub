"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard,
  Users,
  Store,
  Gift,
  Star,
  BarChart3,
  Settings,
  Bell,
  Tags,
  UtensilsCrossed,
} from "lucide-react"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/canteens", icon: Store, label: "Canteens" },
  { href: "/admin/categories", icon: Tags, label: "Categories" },
  { href: "/admin/items", icon: UtensilsCrossed, label: "Items" },
  { href: "/admin/promotions", icon: Gift, label: "Promotions" },
  { href: "/admin/notifications", icon: Bell, label: "Notifications" },
  { href: "/admin/reviews", icon: Star, label: "Reviews" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 border-r bg-background md:block">
      <div className="sticky top-0 h-screen p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">FoodieHub</h1>
          <p className="text-sm text-muted-foreground">Admin Panel</p>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

