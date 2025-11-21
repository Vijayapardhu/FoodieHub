import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsDashboard } from "@/components/canteen-owner/analytics-dashboard"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!canteen) {
    redirect("/canteen")
  }

  // Get orders for last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, order_items(*, items(name))")
    .eq("canteen_id", canteen.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent md:text-3xl">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Track your sales and performance
        </p>
      </div>

      <AnalyticsDashboard orders={recentOrders || []} />
    </div>
  )
}

