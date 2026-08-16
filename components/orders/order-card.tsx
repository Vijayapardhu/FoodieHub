import Link from "next/link"
import { ChevronRight, Store } from "lucide-react"
import { Database } from "@/types/database.types"
import { StatusBadge } from "@/components/ui/status-badge"
import { OrderProgressBar } from "@/components/orders/order-timeline"
import { statusMeta, type OrderStatus } from "@/lib/utils/order-status"
import { formatRelativeTime } from "@/lib/utils/format"
import { orderPath } from "@/lib/utils/public-id"
import { etaLabel, orderEta } from "@/lib/utils/eta"
import { cn } from "@/lib/utils/cn"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: { name: string } | null
}

export function OrderCard({ order }: { order: Order }) {
  const meta = statusMeta(order.status)
  const eta = orderEta(order)
  const etaText = etaLabel(eta)

  return (
    <Link
      href={orderPath(order)}
      prefetch={false}
      aria-label={`Order ${order.token} from ${
        order.canteens?.name ?? "canteen"
      }, ${meta.label}`}
      className="block rounded-2xl border border-border bg-card p-4 shadow-card transition-transform duration-150 ease-spring active:scale-[0.99] md:hover:shadow-lift"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Store className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-bold text-foreground">
              {order.canteens?.name || "Canteen"}
            </p>
            <StatusBadge status={order.status} size="sm" />
          </div>

          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono font-bold tracking-wider text-foreground">
              #{order.token}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              ₹{Number(order.total_amount).toFixed(2)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatRelativeTime(order.created_at)}</span>
          </p>
        </div>

        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <OrderProgressBar
        status={order.status as OrderStatus}
        className="mt-3"
      />

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-xs text-muted-foreground">
          {meta.customerHint}
        </p>
        {etaText ? (
          <p
            className={cn(
              "shrink-0 text-xs font-bold",
              eta.kind === "overdue" ? "text-warning" : "text-primary"
            )}
          >
            {etaText}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
