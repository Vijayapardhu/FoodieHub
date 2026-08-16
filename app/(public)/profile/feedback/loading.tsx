import { AppShell } from "@/components/layout/app-shell"
import { ListSkeleton } from "@/components/ui/loading-state"

export default function FeedbackLoading() {
  return (
    <AppShell title="Your reviews" showBack backHref="/profile">
      <ListSkeleton count={4} />
    </AppShell>
  )
}
