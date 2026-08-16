import {
  BarChart3,
  Bell,
  Gift,
  Inbox,
  LayoutDashboard,
  Megaphone,
  QrCode,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tags,
  Users,
  Utensils,
  UtensilsCrossed,
  type IconComponent,
} from "@/components/ui/icons"

export interface ConsoleNavItem {
  href: string
  icon: IconComponent
  label: string
  /** Shown in the bottom tab bar on mobile. Keep to four per console. */
  primary?: boolean
}

export const ownerNav: ConsoleNavItem[] = [
  { href: "/canteen", icon: LayoutDashboard, label: "Dashboard", primary: true },
  { href: "/canteen/orders", icon: ShoppingBag, label: "Orders", primary: true },
  { href: "/canteen/menu", icon: Utensils, label: "Menu", primary: true },
  { href: "/canteen/orders/scan", icon: QrCode, label: "Scan" },
  { href: "/canteen/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/canteen/offers", icon: Gift, label: "Offers" },
  { href: "/canteen/promotions", icon: Megaphone, label: "Promote" },
  { href: "/canteen/reviews", icon: Star, label: "Reviews" },
  { href: "/canteen/settings", icon: Settings, label: "Settings" },
]

export const adminNav: ConsoleNavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", primary: true },
  { href: "/admin/canteens", icon: Store, label: "Canteens", primary: true },
  { href: "/admin/applications", icon: Inbox, label: "Applications" },
  { href: "/admin/users", icon: Users, label: "Users", primary: true },
  { href: "/admin/items", icon: UtensilsCrossed, label: "Items" },
  { href: "/admin/categories", icon: Tags, label: "Categories" },
  { href: "/admin/promotions", icon: Gift, label: "Promotions" },
  { href: "/admin/reviews", icon: Star, label: "Reviews" },
  { href: "/admin/notifications", icon: Bell, label: "Notifications" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

/**
 * `/canteen` and `/admin` are prefixes of every other route in their console,
 * so an exact match is required for the root; deeper routes match by prefix.
 */
export function isNavItemActive(
  pathname: string,
  href: string,
  rootHref: string
) {
  if (href === rootHref) return pathname === rootHref
  return pathname === href || pathname.startsWith(href + "/")
}
