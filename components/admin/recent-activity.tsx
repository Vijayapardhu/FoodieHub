import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export async function RecentActivity() {
  const supabase = await createClient()

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, canteens(name), users(email)")
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div>
                  <p className="font-semibold">
                    New order from {order.canteens?.name || "Unknown Canteen"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Token: {order.token} • ₹{Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No recent activity</p>
        )}
      </CardContent>
    </Card>
  )
}

