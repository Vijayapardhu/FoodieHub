import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Database } from "@/types/database.types"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: { name: string } | null
}

interface OrderCardProps {
  order: Order
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  preparing: "bg-orange-500",
  ready: "bg-green-500",
  completed: "bg-success",
  cancelled: "bg-destructive",
}

const statusMessages: Record<string, string> = {
  pending: "We’ve received your order and will confirm it soon.",
  confirmed: "Chef has accepted your order. Ingredients being prepped.",
  preparing: "Your order is sizzling in the kitchen right now.",
  ready: "Pick-up counter has your order—show the token.",
  completed: "Order served. Enjoy your meal!",
  cancelled: "Order cancelled. Reach out if you need help.",
}

const steps = ["pending", "confirmed", "preparing", "ready", "completed"]

export function OrderCard({ order }: OrderCardProps) {
  const createdAt = order.created_at ? new Date(order.created_at) : null
  const createdLabel = createdAt
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : "Just now"

  const currentStep = steps.indexOf(order.status)
  const progress =
    currentStep === -1
      ? 100
      : Math.min(100, ((currentStep + 1) / steps.length) * 100)

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block"
      aria-label={`Open order ${order.token} details`}
      prefetch={false}
    >
      <Card className="overflow-hidden rounded-3xl border-0 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Token #{order.token}
              </p>
              <h3 className="text-lg font-semibold text-foreground">
                {order.canteens?.name || "Canteen"}
              </h3>
              <p className="text-sm text-muted-foreground">
                ₹{Number(order.total_amount).toFixed(2)} · {createdLabel}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1">
              <Badge className={statusColors[order.status] || "bg-muted"}>
                {order.status}
              </Badge>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.map((step) => (
                <span
                  key={step}
                  className={
                    steps.indexOf(step) <= currentStep
                      ? "text-primary font-medium"
                      : undefined
                  }
                >
                  {step}
                </span>
              ))}
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {statusMessages[order.status] || "Track this order for updates."}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

