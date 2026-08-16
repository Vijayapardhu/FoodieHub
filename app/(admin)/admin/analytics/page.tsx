import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { PlatformAnalytics } from "@/components/admin/platform-analytics"

export const metadata = { title: "Platform analytics" }

export default async function AnalyticsPage() {
  const { supabase } = await requireRole(["admin"])

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data: orders } = await supabase
    .from("orders")
    .select("*, canteens(name)")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(2000)

  return (
    <>
      <ConsoleHeader
        title="Platform analytics"
        description="Revenue and volume across every canteen — exportable to CSV"
      />

      <PlatformAnalytics orders={(orders ?? []) as any} />
    </>
  )
}
