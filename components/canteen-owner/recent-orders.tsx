import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Database } from "@/types/database.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatRelativeTime } from "@/lib/utils/format"
import { ownerOrderPath } from "@/lib/utils/public-id"

type Order = Database["public"]["Tables"]["orders"]["Row"]

export function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Live queue</CardTitle>
        <Link
          href="/canteen/orders"
          className="text-sm font-semibold text-primary"
        >
          All orders
        </Link>
      </CardHeader>

      <CardContent>
        {orders.length === 0 ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            Nothing in the queue. New orders land here instantly.
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={ownerOrderPath(order)}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors active:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                        #{order.token}
                      </span>
                      <StatusBadge status={order.status} size="sm" showIcon={false} />
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {order.customer_name || "Guest"} ·{" "}
                      {formatRelativeTime(order.created_at)}
                    </span>
                  </span>

                  <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                    ₹{Number(order.total_amount).toFixed(0)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
