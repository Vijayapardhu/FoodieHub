import Link from "next/link"
import { MessageSquare } from "@/components/ui/icons"
import { AppShell } from "@/components/layout/app-shell"
import { OrdersListWithFilters } from "@/components/orders/orders-list-with-filters"
import { requireRole } from "@/lib/auth/require-role"
import { ACTIVE_ORDER_STATUSES } from "@/lib/utils/order-status"
import { PromoSlot } from "@/components/promo/promo-slot"

export const metadata = { title: "Orders" }

export default async function OrdersPage() {
  const { supabase, user } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const select = `
    *,
    canteens:canteens(
      id,
      name,
      contact_phone
    )
  `

  const [
    { data: activeOrdersData, error: activeError },
    { data: pastOrdersData, error: pastError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(select)
      .eq("user_id", user.id)
      .in("status", ACTIVE_ORDER_STATUSES)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(select)
      .eq("user_id", user.id)
      .in("status", ["completed", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(60),
  ])

  if (activeError) console.error("[orders] active", activeError)
  if (pastError) console.error("[orders] past", pastError)

  return (
    <AppShell
      title="Orders"
      actions={
        <Link
          href="/profile/feedback"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
          aria-label="Your reviews"
        >
          <MessageSquare className="h-5 w-5" />
        </Link>
      }
    >
      <div className="space-y-4">
        <OrdersListWithFilters
          activeOrders={(activeOrdersData ?? []) as any}
          pastOrders={(pastOrdersData ?? []) as any}
        />

        {/* Read by someone with time on their hands, waiting for a token to
            turn green — a good place to sell, and a bad place to shout. */}
        <PromoSlot placement="orders" />
      </div>
    </AppShell>
  )
}
