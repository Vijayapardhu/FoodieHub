import { AppShell } from "@/components/layout/app-shell"
import { ListSkeleton } from "@/components/ui/loading-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrdersLoading() {
  return (
    <AppShell title="Orders">
      <div className="space-y-4">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <ListSkeleton count={4} />
      </div>
    </AppShell>
  )
}
