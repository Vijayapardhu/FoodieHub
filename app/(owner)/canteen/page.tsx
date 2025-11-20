import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardStats } from "@/components/canteen-owner/dashboard-stats"
import { RecentOrders } from "@/components/canteen-owner/recent-orders"
import { QuickActions } from "@/components/canteen-owner/quick-actions"
import { RevenueTrendCard } from "@/components/canteen-owner/revenue-trend-card"
import { AttentionItemsCard } from "@/components/canteen-owner/attention-items-card"
import { TopDishesCard } from "@/components/canteen-owner/top-dishes-card"
import { OpsFeedCard } from "@/components/canteen-owner/ops-feed-card"

export default async function CanteenDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get canteen owned by user
  const { data: canteen } = await supabase
    .from("canteens")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  if (!canteen) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">No Canteen Found</h2>
          <p className="mt-2 text-muted-foreground">
            Please contact admin to set up your canteen.
          </p>
        </div>
      </div>
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
      .select("id, total_amount, created_at, status")
      .eq("canteen_id", canteen.id)
      .gte("created_at", startOfWeek.toISOString()),
    supabase
      .from("orders")
      .select("*")
      .eq("canteen_id", canteen.id)
      .in("status", ["pending", "confirmed", "preparing", "ready"])
      .order("created_at", { ascending: false })
      .limit(5),
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
      .select(
        "quantity, items!inner(id, name, image_url, canteen_id)"
      )
      .gte("created_at", startOfWeek.toISOString())
      .limit(200),
  ])

  const weekOrderList = weekOrdersResponse.data ?? []
  const activeOrders = activeOrdersResponse.data
  const opsTimeline = opsTimelineResponse.data ?? []
  const unavailableItems = unavailableItemsResponse.data ?? []
  type TopItemRow = {
    quantity: number | null
    items: { id: string; name: string; image_url: string | null; canteen_id: string } | null
  }
  const topItemsRaw = (topItemsResponse.data as TopItemRow[] | null) ?? []
  const todayRevenue = weekOrderList
    .filter((order) => {
      const created = new Date(order.created_at)
      return created >= today
    })
    .reduce((sum, order) => sum + Number(order.total_amount), 0)

  const yesterdayStart = new Date(today)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const yesterdayRevenue = weekOrderList
    .filter((order) => {
      const created = new Date(order.created_at)
      return created >= yesterdayStart && created < today
    })
    .reduce((sum, order) => sum + Number(order.total_amount), 0)

  const revenueDelta =
    yesterdayRevenue === 0
      ? 100
      : ((todayRevenue - yesterdayRevenue) / Math.max(yesterdayRevenue, 1)) *
        100

  const readyOrders =
    activeOrders?.filter((order) => order.status === "ready").length || 0

  const weeklyRevenueByDay = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + idx)
    const label = date.toLocaleDateString("en-IN", {
      weekday: "short",
    })
    const dayRevenue = weekOrderList
      .filter((order) => {
        const created = new Date(order.created_at)
        return (
          created.getFullYear() === date.getFullYear() &&
          created.getMonth() === date.getMonth() &&
          created.getDate() === date.getDate()
        )
      })
      .reduce((sum, order) => sum + Number(order.total_amount), 0)
    return { label, value: dayRevenue }
  })

  const attentionItems = unavailableItems.map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.image_url,
    price: item.price,
  }))

  const topItemMap = new Map<
    string,
    { id: string; name: string; imageUrl: string | null; count: number }
  >()
  topItemsRaw
    .filter((row) => row.items?.canteen_id === canteen.id)
    .forEach((row) => {
      const item = row.items
      if (!item) return
      const existing = topItemMap.get(item.id) || {
        id: item.id,
        name: item.name,
        imageUrl: item.image_url,
        count: 0,
      }
      existing.count += row.quantity || 0
      topItemMap.set(item.id, existing)
    })

  const topDishes = Array.from(topItemMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  const opsFeed = (opsTimeline ?? []).map((entry) => ({
    id: entry.id,
    status: entry.status,
    createdAt: entry.created_at,
    customer: entry.customer_name,
    amount: entry.total_amount,
  }))

  const metrics = {
    todayRevenue,
    revenueDelta,
    activeOrders: activeOrders?.length || 0,
    readyOrders,
    rating: Number(canteen.rating),
    avgTicket:
      weekOrderList.length > 0
        ? weekOrderList.reduce(
            (sum, order) => sum + Number(order.total_amount),
            0
          ) / weekOrderList.length
        : 0,
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {canteen.name}</p>
      </div>

      <DashboardStats metrics={metrics} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <RevenueTrendCard weeklyData={weeklyRevenueByDay} />
        <AttentionItemsCard items={attentionItems} />
        <OpsFeedCard events={opsFeed} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RecentOrders orders={activeOrders || []} />
        <TopDishesCard dishes={topDishes} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <QuickActions canteenId={canteen.id} />
      </div>
    </div>
  )
}

