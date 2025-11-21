import { PlatformAnalytics } from "@/components/admin/platform-analytics"
import { requireRole } from "@/lib/auth/require-role"

export default async function AnalyticsPage() {
  const { supabase } = await requireRole(["admin"])

  // Get platform-wide stats
  const { data: orders } = await supabase
    .from("orders")
    .select("*, canteens(name)")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(1000)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          Platform Analytics
        </h1>
        <p className="text-muted-foreground">
          Platform-wide statistics and insights
        </p>
      </div>

      <PlatformAnalytics orders={orders || []} />
    </div>
  )
}

