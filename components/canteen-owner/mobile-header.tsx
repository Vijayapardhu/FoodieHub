"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { Menu, X } from "lucide-react"
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

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
        <div>
          <h1 className="text-lg font-bold text-primary">FoodieHub</h1>
          <p className="text-xs text-muted-foreground">Canteen Owner</p>
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-lg p-2 hover:bg-muted"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-64 border-r bg-background p-4 shadow-lg transition-transform md:hidden">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-primary">FoodieHub</h1>
                <p className="text-sm text-muted-foreground">Canteen Owner</p>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg p-2 hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
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
          </aside>
        </>
      )}
    </>
  )
}

