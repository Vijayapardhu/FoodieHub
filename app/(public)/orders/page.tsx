import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { OrderCard } from "@/components/orders/order-card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/loading-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle } from "lucide-react"
import { requireRole } from "@/lib/auth/require-role"

export default async function OrdersPage() {
  const { supabase, user } = await requireRole([
    "student",
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
    <div className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground">
              Track active tokens or revisit a previous meal—clean and simple.
            </p>
          </div>
          <Link
            href="/profile/feedback"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <HelpCircle className="h-4 w-4" />
            Manage feedback
          </Link>
        </header>

        <Tabs defaultValue="active" className="space-y-5">
          <TabsList className="grid w-full grid-cols-2 rounded-full bg-white p-1 shadow-sm">
            <TabsTrigger
              value="active"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Past ({pastOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {showGlobalPlaceholder && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-28 rounded-3xl" />
                ))}
              </div>
            )}
            {!showGlobalPlaceholder && activeOrders.length === 0 && (
              <EmptyOrdersState
                title="Nothing cooking yet"
                description="Place an order to track your token in real-time."
              />
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {pastOrders.length === 0 && !showGlobalPlaceholder && (
              <EmptyOrdersState
                title="No past orders"
                description="Finish a meal and share your feedback to help canteens improve."
                ctaLabel="Browse canteens"
                ctaHref="/home"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  )
}

function EmptyOrdersState({
  title,
  description,
  ctaLabel = "Order now",
  ctaHref = "/home",
}: {
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 p-6 text-center">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex justify-center">
        <Link href={ctaHref}>
          <Button className="rounded-full bg-primary text-white hover:bg-primary/90">
            {ctaLabel}
          </Button>
        </Link>
      </div>
    </div>
  )
}

