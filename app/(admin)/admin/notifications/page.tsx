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
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          Notifications
        </h1>
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

