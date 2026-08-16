import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { AdminNotificationComposer } from "@/components/admin/admin-notification-composer"

export const metadata = { title: "Notifications" }

export default async function AdminNotificationsPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: recentNotifications } = await supabase
    .from("notifications")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(40)

  return (
    <>
      <ConsoleHeader
        title="Notifications"
        description="Broadcast an announcement, or message one person"
      />

      <AdminNotificationComposer
        recentNotifications={(recentNotifications ?? []) as any}
      />
    </>
  )
}
