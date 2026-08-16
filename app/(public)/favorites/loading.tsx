import { AppShell } from "@/components/layout/app-shell"
import { CardGridSkeleton } from "@/components/ui/loading-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function FavoritesLoading() {
  return (
    <AppShell title="Saved">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <CardGridSkeleton count={6} />
      </div>
    </AppShell>
  )
}
