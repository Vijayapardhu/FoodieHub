import { AppShell } from "@/components/layout/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The token card first: someone opening this screen at the counter is looking
 * for their code, so its slot is reserved before anything else.
 */
export default function OrderDetailLoading() {
  return (
    <AppShell title="Track order" showBack backHref="/orders">
      <div className="space-y-5">
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-[172px] w-[172px] rounded-2xl" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </section>

        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-xl" />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
