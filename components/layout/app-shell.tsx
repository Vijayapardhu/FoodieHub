import { AppBar, type AppBarProps } from "@/components/layout/app-bar"
import { TabBar } from "@/components/layout/tab-bar"
import { MaintenanceBanner } from "@/components/layout/maintenance-banner"
import { cn } from "@/lib/utils/cn"

interface AppShellProps extends AppBarProps {
  children: React.ReactNode
  /** Drop the app bar on screens that render their own immersive header. */
  hideAppBar?: boolean
  /** Extra bottom padding, e.g. when the page also shows a sticky action bar. */
  bottomPad?: "default" | "action-bar"
  contentClassName?: string
}

/**
 * Standard chrome for every signed-in customer screen: sticky app bar on top,
 * fixed tab bar at the bottom on mobile, and a content column that reserves
 * room for both plus the device safe areas.
 */
export function AppShell({
  children,
  hideAppBar = false,
  bottomPad = "default",
  contentClassName,
  ...appBarProps
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {hideAppBar ? null : <AppBar {...appBarProps} />}
      <MaintenanceBanner />

      <main
        id="main"
        className={cn(
          "app-container py-4 sm:py-6",
          bottomPad === "action-bar"
            ? "pb-[calc(theme(spacing.tabbar)+7rem+env(safe-area-inset-bottom))] md:pb-32"
            : "pb-[calc(theme(spacing.tabbar)+1.5rem+env(safe-area-inset-bottom))] md:pb-12",
          contentClassName
        )}
      >
        {children}
      </main>

      <TabBar />
    </div>
  )
}
