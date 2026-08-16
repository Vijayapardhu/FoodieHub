"use client"

import { cn } from "@/lib/utils/cn"

/**
 * Bottom-docked action bar for primary page actions (checkout, save, confirm).
 * `aboveTabBar` lifts it clear of the mobile tab bar; drop it on screens that
 * don't render one (owner/admin detail pages).
 */
export function StickyBar({
  children,
  className,
  aboveTabBar = true,
  context = "app",
}: {
  children: React.ReactNode
  className?: string
  aboveTabBar?: boolean
  /**
   * `console` keeps the bar clear of the owner/admin sidebar. Without it the
   * bar spans the whole viewport and lays a translucent strip across the nav,
   * which reads as a bug on a desktop screen.
   */
  context?: "app" | "console"
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 border-t border-border glass px-4 py-3 shadow-sheet",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        aboveTabBar
          ? "bottom-[calc(theme(spacing.tabbar)+env(safe-area-inset-bottom))] md:bottom-0 md:pb-3"
          : "bottom-0",
        context === "console" && "md:left-64",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto w-full",
          context === "console" ? "max-w-5xl" : "max-w-3xl lg:max-w-5xl"
        )}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Spacer that reserves the height a StickyBar occupies, so the last item in a
 * scrolling list is never hidden behind it.
 */
export function StickyBarSpacer({
  className,
}: {
  className?: string
}) {
  return <div aria-hidden="true" className={cn("h-24", className)} />
}
