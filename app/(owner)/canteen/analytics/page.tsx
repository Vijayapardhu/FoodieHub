import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { AnalyticsDashboard } from "@/components/canteen-owner/analytics-dashboard"

export const metadata = { title: "Analytics" }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!canteen) redirect("/canteen")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, order_items(*, items(name))")
    .eq("canteen_id", canteen.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })

  return (
    <>
      <ConsoleHeader
        title="Analytics"
        description="Sales, bestsellers and peak hours — exportable to CSV"
      />

      <AnalyticsDashboard orders={(recentOrders ?? []) as any} />
    </>
  )
}
