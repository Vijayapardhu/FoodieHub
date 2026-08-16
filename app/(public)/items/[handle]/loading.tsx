import { AppShell } from "@/components/layout/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function ItemLoading() {
  return (
    <AppShell hideAppBar bottomPad="action-bar">
      <div className="space-y-5">
        <Skeleton className="-mx-4 aspect-[4/3] rounded-b-3xl sm:-mx-5" />

        <div className="space-y-2">
          <Skeleton className="h-7 w-3/5" />
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-6 w-24" />
        </div>

        <Skeleton className="h-20 w-full rounded-2xl" />

        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
