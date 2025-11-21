import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats"
import { RecentActivity } from "@/components/admin/recent-activity"
import { requireRole } from "@/lib/auth/require-role"

export default async function AdminDashboardPage() {
  const { supabase } = await requireRole(["admin"])

  // Get platform stats
  const { data: users } = await supabase
    .from("users")
    .select("id, role")
    .limit(1000)

  const { data: canteens } = await supabase
    .from("canteens")
    .select("id, is_open")
    .limit(1000)

  const { data: orders } = await supabase
    .from("orders")
    .select("total_amount, status")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(1000)

  const { data: pendingPromotions } = await supabase
    .from("offers")
    .select("id")
    .eq("is_approved", false)
    .limit(100)

  const totalUsers = users?.length || 0
  const totalCanteens = canteens?.length || 0
  const activeCanteens = canteens?.filter((c) => c.is_open).length || 0
  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0
  const pendingPromotionsCount = pendingPromotions?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Platform overview and statistics</p>
      </div>

      <AdminDashboardStats
        totalUsers={totalUsers}
        totalCanteens={totalCanteens}
        activeCanteens={activeCanteens}
        totalRevenue={totalRevenue}
        pendingPromotions={pendingPromotionsCount}
      />

      <div className="mt-6">
        <RecentActivity />
      </div>
    </div>
  )
}

