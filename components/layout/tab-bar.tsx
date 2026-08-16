"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Home, Receipt, ShoppingCart, User } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useCartCount } from "@/lib/hooks/use-cart-count"

const tabs = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/orders", icon: Receipt, label: "Orders" },
  { href: "/cart", icon: ShoppingCart, label: "Cart", badge: "cart" as const },
  { href: "/favorites", icon: Heart, label: "Saved" },
  { href: "/profile", icon: User, label: "Profile" },
]

/**
 * Primary mobile navigation. Fixed to the bottom so every destination stays in
 * thumb reach; hidden from `md` up where the app bar carries the same links.
 */
export function TabBar() {
  const pathname = usePathname() ?? ""
  const { count } = useCartCount()

  return (
    <nav
      data-tab-bar
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass pb-safe md:hidden"
    >
      <ul className="mx-auto flex h-tabbar max-w-lg items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + "/")
          const showBadge = tab.badge === "cart" && count > 0

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="tap-transparent flex h-full flex-col items-center justify-center gap-1 active:scale-95"
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <Icon
                    className={cn(
                      "h-[22px] w-[22px] transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 2.4 : 1.9}
                    aria-hidden="true"
                  />
                  {showBadge ? (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                      {count > 99 ? "99+" : count}
                      <span className="sr-only"> items in cart</span>
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold leading-none transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
