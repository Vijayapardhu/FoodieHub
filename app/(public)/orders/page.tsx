import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { OrdersListWithFilters } from "@/components/orders/orders-list-with-filters"
import Link from "next/link"
import { HelpCircle } from "lucide-react"
import { requireRole } from "@/lib/auth/require-role"

export default async function OrdersPage() {
  const { supabase, user } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const orderListSelect = `
    *,
    canteens:canteens!inner(
      id,
      name,
      contact_phone
    )
  `

  const { data: activeOrdersData, error: activeError } = await supabase
    .from("orders")
    .select(orderListSelect)
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed", "preparing", "ready"])
    .order("created_at", { ascending: false })

  const { data: pastOrdersData, error: pastError } = await supabase
    .from("orders")
    .select(orderListSelect)
    .eq("user_id", user.id)
    .in("status", ["completed", "cancelled"])
    .order("created_at", { ascending: false })

  if (activeError) {
    console.error("[orders] failed to fetch active orders", activeError)
  }
  if (pastError) {
    console.error("[orders] failed to fetch past orders", pastError)
  }

  const activeOrders = activeOrdersData ?? []
  const pastOrders = pastOrdersData ?? []
  const showGlobalPlaceholder =
    activeOrders.length === 0 && pastOrders.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 pb-20">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
              Orders
            </h1>
            <p className="text-sm text-muted-foreground">
              Track active tokens or revisit a previous meal—clean and simple.
            </p>
          </div>
          <Link
            href="/profile/feedback"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/5 hover:shadow-sm"
          >
            <HelpCircle className="h-4 w-4" />
            Manage feedback
          </Link>
        </header>

        <OrdersListWithFilters
          activeOrders={activeOrders}
          pastOrders={pastOrders}
          showGlobalPlaceholder={showGlobalPlaceholder}
        />
      </div>
      <BottomNav />
    </div>
  )
}

