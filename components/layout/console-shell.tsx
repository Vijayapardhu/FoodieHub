"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, Menu, MoreHorizontal } from "lucide-react"
import { LogoMark } from "@/components/brand/logo"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { NotificationBell } from "@/components/notifications/notification-center"
import { ThemeToggleButton } from "@/components/ui/theme-toggle"
import { LogoutButton } from "@/components/profile/logout-button"
import {
  adminNav,
  isNavItemActive,
  ownerNav,
} from "@/components/layout/console-nav"
import { cn } from "@/lib/utils/cn"

/**
 * The nav arrays hold lucide icon *components*, which are functions and so
 * cannot be serialized across the server/client boundary. The server layouts
 * therefore pass a plain string and this client component resolves the rest.
 */
const CONSOLES = {
  owner: { nav: ownerNav, rootHref: "/canteen", subtitle: "Canteen owner" },
  admin: { nav: adminNav, rootHref: "/admin", subtitle: "Admin console" },
} as const

export type ConsoleVariant = keyof typeof CONSOLES

interface ConsoleShellProps {
  variant: ConsoleVariant
  children: React.ReactNode
}

/**
 * Chrome for the owner and admin consoles: a persistent sidebar from `md` up,
 * and on mobile a top bar plus a four-slot bottom tab bar with a "More" drawer
 * for the remaining destinations.
 */
export function ConsoleShell({ variant, children }: ConsoleShellProps) {
  const { nav, rootHref, subtitle } = CONSOLES[variant]
  const pathname = usePathname() ?? ""
  const [drawerOpen, setDrawerOpen] = useState(false)

  const primary = nav.filter((item) => item.primary).slice(0, 4)
  const activeItem = nav.find((item) =>
    isNavItemActive(pathname, item.href, rootHref)
  )
  const overflowActive =
    activeItem !== undefined && !primary.includes(activeItem)

  const Brand = (
    <Link href={rootHref} className="flex items-center gap-2.5">
      <LogoMark className="h-9 w-9" />
      <span className="min-w-0">
        <span className="block text-sm font-extrabold leading-tight tracking-tight text-foreground">
          Foodie<span className="text-primary">Hub</span>
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      </span>
    </Link>
  )

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="space-y-1">
      {nav.map((item) => {
        const Icon = item.icon
        const active = isNavItemActive(pathname, item.href, rootHref)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-touch items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors",
              active
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block">
        <div className="sticky top-0 flex h-screen flex-col gap-6 p-4">
          {Brand}
          <div className="flex-1 overflow-y-auto">
            <NavLinks />
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            <Link
              href="/home"
              className="flex min-h-touch items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="h-[18px] w-[18px]" />
              Customer app
            </Link>
            <LogoutButton variant="ghost" size="sm" block className="justify-start px-3.5" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header
          data-app-bar
          className="sticky top-0 z-40 border-b border-border glass pt-safe md:hidden"
        >
          <div className="flex h-appbar items-center gap-2 px-3">
            {Brand}
            <div className="flex-1" />
            <ThemeToggleButton />
            <NotificationBell />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main
          id="main"
          /* Capped and centred: without a ceiling, a two-column card grid on
             a 27-inch monitor stretches each card to a width nobody can scan. */
          className="mx-auto w-full max-w-[110rem] flex-1 px-4 py-4 pb-[calc(theme(spacing.tabbar)+1.5rem+env(safe-area-inset-bottom))] sm:px-5 md:px-6 md:py-6 md:pb-10"
        >
          {children}
        </main>

        {/* Mobile bottom tabs */}
        <nav
          data-tab-bar
          aria-label="Console sections"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass pb-safe md:hidden"
        >
          <ul className="flex h-tabbar items-stretch">
            {primary.map((item) => {
              const Icon = item.icon
              const active = isNavItemActive(pathname, item.href, rootHref)
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="tap-transparent flex h-full flex-col items-center justify-center gap-1 active:scale-95"
                  >
                    <Icon
                      className={cn(
                        "h-[22px] w-[22px]",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                      strokeWidth={active ? 2.4 : 1.9}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-semibold leading-none",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}

            <li className="flex-1">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="tap-transparent flex h-full w-full flex-col items-center justify-center gap-1 active:scale-95"
              >
                <MoreHorizontal
                  className={cn(
                    "h-[22px] w-[22px]",
                    overflowActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={overflowActive ? 2.4 : 1.9}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold leading-none",
                    overflowActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  More
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh]">
          <SheetHeader className="pr-12">
            <SheetTitle>{subtitle}</SheetTitle>
          </SheetHeader>

          <SheetBody className="space-y-3 pb-6">
            <NavLinks onNavigate={() => setDrawerOpen(false)} />

            <div className="space-y-2 border-t border-border pt-3">
              <Link
                href="/home"
                onClick={() => setDrawerOpen(false)}
                className="flex min-h-touch items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
              >
                <ExternalLink className="h-[18px] w-[18px]" />
                Customer app
              </Link>
              <LogoutButton
                variant="outline"
                block
                className="border-destructive/40 text-destructive hover:bg-destructive-soft"
              />
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/** Page-level heading used inside a console screen. */
export function ConsoleHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
