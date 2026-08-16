import { AppShell } from "@/components/layout/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Mirrors the real home layout — greeting, search, chips, banner, rails — so
 * the page settles into place instead of jumping when the data lands.
 */
export default function HomeLoading() {
  return (
    <AppShell>
      <div className="space-y-7">
        <header className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-64 max-w-full" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>

          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
            ))}
          </div>
        </header>

        <Skeleton className="aspect-[2/1] w-full rounded-2xl sm:aspect-[3/1]" />

        <section className="space-y-3">
          <Skeleton className="h-6 w-36" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <Skeleton className="h-6 w-44" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
