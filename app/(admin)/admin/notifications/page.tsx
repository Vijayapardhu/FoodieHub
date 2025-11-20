import { requireRole } from "@/lib/auth/require-role"
import { AdminNotificationComposer } from "@/components/admin/admin-notification-composer"

export default async function AdminNotificationsPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: recentNotifications } = await supabase
    .from("notifications")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(40)

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Broadcast announcements or targeted updates to any audience.
        </p>
      </header>
      <AdminNotificationComposer
        recentNotifications={recentNotifications ?? []}
      />
    </div>
  )
}

