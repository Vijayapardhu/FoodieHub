import { AppShell } from "@/components/layout/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

/** Matches the immersive canteen header, which draws its own app bar. */
export default function CanteenLoading() {
  return (
    <AppShell hideAppBar bottomPad="action-bar">
      <div className="space-y-5">
        <Skeleton className="-mx-4 h-48 rounded-b-3xl sm:-mx-5" />

        <div className="space-y-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>

        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
