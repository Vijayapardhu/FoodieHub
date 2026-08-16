"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, Heart, Home, Receipt, ShoppingCart, User } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useCartCount } from "@/lib/hooks/use-cart-count"
import { Logo } from "@/components/brand/logo"
import { NotificationBell } from "@/components/notifications/notification-center"
import { ThemeToggleButton } from "@/components/ui/theme-toggle"

const desktopLinks = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/orders", icon: Receipt, label: "Orders" },
  { href: "/favorites", icon: Heart, label: "Saved" },
  { href: "/profile", icon: User, label: "Profile" },
]

export interface AppBarProps {
  /** Replaces the wordmark with a back button and this title. */
  title?: string
  /** Where back goes. Defaults to router.back(). */
  backHref?: string
  showBack?: boolean
  /** Right-hand slot; replaces the default cart + bell cluster when provided. */
  actions?: React.ReactNode
  /** Hides the bar on scroll-heavy detail screens that draw their own header. */
  transparent?: boolean
  className?: string
}

export function AppBar({
  title,
  backHref,
  showBack = false,
  actions,
  transparent = false,
  className,
}: AppBarProps) {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const { count } = useCartCount()

  const handleBack = () => {
    if (backHref) router.push(backHref)
    else router.back()
  }

  return (
    <header
      data-app-bar
      className={cn(
        "sticky top-0 z-40 pt-safe",
        transparent
          ? "bg-transparent"
          : "border-b border-border glass",
        className
      )}
    >
      <div className="mx-auto flex h-appbar w-full max-w-3xl items-center gap-1 px-2 sm:px-4 lg:max-w-5xl">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <Link
            href="/home"
            className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-1"
            aria-label="FoodieHub home"
          >
            <Logo
              markClassName="h-8 w-8"
              wordClassName="text-base"
              wordHiddenClassName="hidden xs:block"
              className="gap-2"
            />
          </Link>
        )}

        {title ? (
          <h1 className="min-w-0 flex-1 truncate px-1 text-base font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        ) : (
          <div className="flex-1" />
        )}

        {/* Desktop gets the full nav; phones rely on the bottom tab bar. */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Sections">
          {desktopLinks.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5">
          {actions ?? (
            <>
              <ThemeToggleButton className="hidden sm:flex" />
              <NotificationBell />
              <Link
                href="/cart"
                aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted active:scale-95"
              >
                <ShoppingCart className="h-5 w-5" />
                {count > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
