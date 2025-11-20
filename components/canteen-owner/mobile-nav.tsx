"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  TrendingUp,
  Gift,
  Star,
  Settings,
} from "lucide-react"

const navItems = [
  { href: "/canteen", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/canteen/menu", icon: Utensils, label: "Menu" },
  { href: "/canteen/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/canteen/analytics", icon: TrendingUp, label: "Analytics" },
  { href: "/canteen/offers", icon: Gift, label: "Offers" },
  { href: "/canteen/reviews", icon: Star, label: "Reviews" },
  { href: "/canteen/settings", icon: Settings, label: "Settings" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg md:hidden">
      <div className="flex justify-around px-2 py-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

