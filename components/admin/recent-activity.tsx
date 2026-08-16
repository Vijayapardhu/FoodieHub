import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { createClient } from "@/lib/supabase/server"
import { formatRelativeTime } from "@/lib/utils/format"

export async function RecentActivity() {
  const supabase = await createClient()

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, canteens(name), users(email, full_name)")
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Latest orders</CardTitle>
        <Link
          href="/admin/analytics"
          className="text-sm font-semibold text-primary"
        >
          Analytics
        </Link>
      </CardHeader>

      <CardContent>
        {!recentOrders || recentOrders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Platform activity shows up here as students start ordering."
            compact
          />
        ) : (
          <ul className="divide-y divide-border">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {order.canteens?.name || "Unknown canteen"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    #{order.token} ·{" "}
                    {order.users?.full_name || order.users?.email || "Guest"} ·{" "}
                    {formatRelativeTime(order.created_at)}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                  ₹{Number(order.total_amount).toFixed(0)}
                </span>
                <StatusBadge status={order.status} size="sm" showIcon={false} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
