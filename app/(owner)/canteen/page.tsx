import { redirect } from "next/navigation"
import { Store } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { EmptyState } from "@/components/ui/empty-state"
import { DashboardStats } from "@/components/canteen-owner/dashboard-stats"
import { QuickActions } from "@/components/canteen-owner/quick-actions"
import { RevenueTrendCard } from "@/components/canteen-owner/revenue-trend-card"
import { AttentionItemsCard } from "@/components/canteen-owner/attention-items-card"
import { TopDishesCard } from "@/components/canteen-owner/top-dishes-card"
import { OpsFeedCard } from "@/components/canteen-owner/ops-feed-card"
import { ACTIVE_ORDER_STATUSES } from "@/lib/utils/order-status"
import { NeedsYouNow } from "@/components/canteen-owner/needs-you-now"
import { OpenToggle } from "@/components/canteen-owner/open-toggle"
import { SoldOutSheet } from "@/components/canteen-owner/sold-out-sheet"
import { CashUpCard } from "@/components/canteen-owner/cash-up-card"
import type { QueueOrder } from "@/lib/hooks/use-live-queue"

export const metadata = { title: "Dashboard" }

export default async function CanteenDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: canteen } = await supabase
    .from("canteens")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!canteen) {
    return (
      <EmptyState
        icon={Store}
        title="No canteen registered yet"
        description="Register your canteen to publish a menu and start taking orders."
        action={{ label: "Register your canteen", href: "/canteen/register" }}
      />
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(startOfWeek.getDate() - 6)

  const [
    weekOrdersResponse,
    activeOrdersResponse,
    opsTimelineResponse,
    unavailableItemsResponse,
    topItemsResponse,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total_amount, created_at, status, payment_status")
      .eq("canteen_id", canteen.id)
      .gte("created_at", startOfWeek.toISOString()),
    supabase
      .from("orders")
      .select(
        "id, token, status, total_amount, created_at, estimated_preparation_time, scheduled_pickup_time, special_instructions, dietary_notes, customer_name, customer_phone, users(email, full_name), order_items(quantity, items(name))"
      )
      .eq("canteen_id", canteen.id)
      .in("status", ACTIVE_ORDER_STATUSES)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, status, created_at, total_amount, customer_name")
      .eq("canteen_id", canteen.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("items")
      .select("id, name, image_url, price, is_available")
      .eq("canteen_id", canteen.id)
      .eq("is_available", false)
      .limit(5),
    supabase
      .from("order_items")
      .select("quantity, items!inner(id, name, image_url, canteen_id)")
      .gte("created_at", startOfWeek.toISOString())
      .limit(400),
  ])

  const weekOrders = weekOrdersResponse.data ?? []
  const activeOrders = activeOrdersResponse.data ?? []
  const opsTimeline = opsTimelineResponse.data ?? []
  const unavailableItems = unavailableItemsResponse.data ?? []

  type TopItemRow = {
    quantity: number | null
    items: {
      id: string
      name: string
      image_url: string | null
      canteen_id: string
    } | null
  }
  const topItemsRaw = (topItemsResponse.data as TopItemRow[] | null) ?? []

  const inRange = (value: string, from: Date, to?: Date) => {
    const created = new Date(value)
    return created >= from && (!to || created < to)
  }

  const todayRevenue = weekOrders
    .filter((order) => inRange(order.created_at, today))
    .reduce((sum, order) => sum + Number(order.total_amount), 0)

  const yesterdayStart = new Date(today)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const yesterdayRevenue = weekOrders
    .filter((order) => inRange(order.created_at, yesterdayStart, today))
    .reduce((sum, order) => sum + Number(order.total_amount), 0)

  // With no trade yesterday any change is undefined rather than +100%.
  const revenueDelta =
    yesterdayRevenue === 0
      ? todayRevenue > 0
        ? 100
        : 0
      : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100

  const weeklyRevenueByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + index)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    return {
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      value: weekOrders
        .filter((order) => inRange(order.created_at, date, nextDate))
        .reduce((sum, order) => sum + Number(order.total_amount), 0),
    }
  })

  const topItemMap = new Map<
    string,
    { id: string; name: string; imageUrl: string | null; count: number }
  >()
  for (const row of topItemsRaw) {
    const item = row.items
    if (!item || item.canteen_id !== canteen.id) continue
    const existing = topItemMap.get(item.id) ?? {
      id: item.id,
      name: item.name,
      imageUrl: item.image_url,
      count: 0,
    }
    existing.count += row.quantity ?? 0
    topItemMap.set(item.id, existing)
  }

  const topDishes = Array.from(topItemMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Money actually taken today, versus money still owed at the counter.
  const todaysOrders = weekOrders.filter((order) =>
    inRange(order.created_at, today)
  )
  const settled = todaysOrders.filter(
    (order) => order.payment_status === "completed"
  )
  const outstanding = todaysOrders.filter(
    (order) =>
      order.payment_status !== "completed" && order.status !== "cancelled"
  )
  const cashUp = {
    collected: settled.reduce((sum, o) => sum + Number(o.total_amount), 0),
    collectedCount: settled.length,
    awaiting: outstanding.reduce((sum, o) => sum + Number(o.total_amount), 0),
    awaitingCount: outstanding.length,
  }

  const metrics = {
    todayRevenue,
    revenueDelta,
    activeOrders: activeOrders.length,
    readyOrders: activeOrders.filter((order) => order.status === "ready").length,
    rating: Number(canteen.rating),
    avgTicket:
      weekOrders.length > 0
        ? weekOrders.reduce(
            (sum, order) => sum + Number(order.total_amount),
            0
          ) / weekOrders.length
        : 0,
  }

  return (
    <>
      <ConsoleHeader
        title={canteen.name}
        description="Today at a glance"
        actions={
          <>
            <SoldOutSheet canteenId={canteen.id} />
            <OpenToggle canteenId={canteen.id} isOpen={canteen.is_open} />
          </>
        }
      />

      <div className="space-y-4">
        {/* Live, and first: everything below it reports on the past. */}
        <NeedsYouNow
          canteenId={canteen.id}
          initialOrders={
            (activeOrders as any[]).map((order) => ({
              ...order,
              lines: (order.order_items ?? []).map((line: any) => ({
                quantity: line.quantity,
                name: line.items?.name ?? "Item",
              })),
            })) as QueueOrder[]
          }
        />

        <DashboardStats metrics={metrics} />

        <div className="grid gap-4 lg:grid-cols-2">
          <CashUpCard {...cashUp} />
          <RevenueTrendCard weeklyData={weeklyRevenueByDay} />
        </div>

        <QuickActions canteenId={canteen.id} />

        <div className="grid gap-4 lg:grid-cols-3">
          <TopDishesCard dishes={topDishes} />
          <AttentionItemsCard
            items={unavailableItems.map((item) => ({
              id: item.id,
              name: item.name,
              imageUrl: item.image_url,
              price: item.price,
            }))}
          />
          <OpsFeedCard
            events={opsTimeline.map((entry) => ({
              id: entry.id,
              status: entry.status,
              createdAt: entry.created_at,
              customer: entry.customer_name,
              amount: entry.total_amount,
            }))}
          />
        </div>
      </div>
    </>
  )
}
