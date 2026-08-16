import Link from "next/link"
import { Store, TicketPercent } from "@/components/ui/icons"
import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats"
import { RecentActivity } from "@/components/admin/recent-activity"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = { title: "Admin dashboard" }

export default async function AdminDashboardPage() {
  const { supabase } = await requireRole(["admin"])

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString()

  const [
    { count: totalUsers },
    { data: canteens },
    { data: orders },
    { count: pendingPromotions },
  ] = await Promise.all([
    supabase.from("users").select("*", { head: true, count: "exact" }),
    supabase.from("canteens").select("id, is_open, is_approved").limit(1000),
    supabase
      .from("orders")
      .select("total_amount, status")
      .gte("created_at", thirtyDaysAgo)
      .limit(2000),
    supabase
      .from("offers")
      .select("*", { head: true, count: "exact" })
      .eq("is_approved", false),
  ])

  const canteenList = canteens ?? []
  const pendingCanteens = canteenList.filter((c) => !c.is_approved).length

  // Only collected orders count as platform revenue.
  const totalRevenue = (orders ?? [])
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + Number(order.total_amount), 0)

  const actionsNeeded = pendingCanteens + (pendingPromotions ?? 0)

  return (
    <>
      <ConsoleHeader
        title="Platform overview"
        description="Everything happening across FoodieHub"
      />

      <div className="space-y-4">
        {actionsNeeded > 0 ? (
          <Card variant="flat" className="border-warning/30 bg-warning-soft">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <p className="flex-1 text-sm font-medium text-warning">
                {actionsNeeded} {actionsNeeded === 1 ? "item needs" : "items need"}{" "}
                your review.
              </p>
              <div className="flex gap-2">
                {pendingCanteens > 0 ? (
                  <Link
                    href="/admin/canteens"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-xs font-bold text-warning-foreground"
                  >
                    <Store className="h-3.5 w-3.5" />
                    {pendingCanteens} canteens
                  </Link>
                ) : null}
                {(pendingPromotions ?? 0) > 0 ? (
                  <Link
                    href="/admin/promotions"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-xs font-bold text-warning-foreground"
                  >
                    <TicketPercent className="h-3.5 w-3.5" />
                    {pendingPromotions} offers
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <AdminDashboardStats
          totalUsers={totalUsers ?? 0}
          totalCanteens={canteenList.length}
          activeCanteens={canteenList.filter((c) => c.is_open).length}
          pendingCanteens={pendingCanteens}
          totalRevenue={totalRevenue}
          pendingPromotions={pendingPromotions ?? 0}
        />

        <RecentActivity />
      </div>
    </>
  )
}
