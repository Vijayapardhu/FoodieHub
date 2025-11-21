"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingBag, User } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 md:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 relative"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-br from-primary to-orange-400 text-white shadow-lg shadow-primary/25 scale-105"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors",
                  isActive ? "text-primary" : "text-gray-500"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

