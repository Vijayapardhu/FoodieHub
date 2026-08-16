import { AppShell } from "@/components/layout/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <AppShell title="Profile">
      <div className="space-y-6">
        <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>

        {Array.from({ length: 2 }).map((_, i) => (
          <section key={i} className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </section>
        ))}

        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </AppShell>
  )
}
