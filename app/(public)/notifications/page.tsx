import { AppShell } from "@/components/layout/app-shell"
import { NotificationsPageContent } from "@/components/notifications/notifications-page-content"
import { requireRole } from "@/lib/auth/require-role"

export const metadata = { title: "Notifications" }

export default async function NotificationsPage() {
  await requireRole(["user", "canteen_owner", "admin"])

  return (
    <AppShell title="Notifications" showBack backHref="/home">
      <NotificationsPageContent />
    </AppShell>
  )
}
