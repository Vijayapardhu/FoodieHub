import { AppShell } from "@/components/layout/app-shell"
import { ProfileHero } from "@/components/profile/profile-hero"
import { ProfileStats } from "@/components/profile/profile-stats"
import { ProfileLists } from "@/components/profile/profile-lists"
import { ProfileActions } from "@/components/profile/profile-actions"
import { Database } from "@/types/database.types"
import { requireRole } from "@/lib/auth/require-role"
import { ACTIVE_ORDER_STATUSES } from "@/lib/utils/order-status"

export const metadata = { title: "Profile" }

type Profile = Database["public"]["Tables"]["users"]["Row"]
type OrderSummary = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: { name: string } | null
}
type FeedbackSummary = Database["public"]["Tables"]["reviews"]["Row"] & {
  items: { name: string } | null
  canteens: { name: string } | null
}
type FavoriteHighlight = {
  id: string
  type: "item" | "canteen"
  name: string
  subtitle?: string
  imageUrl?: string | null
}

export default async function ProfilePage() {
  const { supabase, user, role } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const [
    { data: profile },
    { data: recentOrders },
    { data: favorites },
    { count: totalOrdersCount },
    { count: activeOrdersCount },
    { count: favoritesCount },
    { data: spendRows },
    { data: feedbacks },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("orders")
      .select("*, canteens:canteens(id, name, contact_phone)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("favorites")
      .select("*, items(*, canteens(name)), canteens(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("orders")
      .select("*", { head: true, count: "exact" })
      .eq("user_id", user.id),
    supabase
      .from("orders")
      .select("*", { head: true, count: "exact" })
      .eq("user_id", user.id)
      .in("status", ACTIVE_ORDER_STATUSES),
    supabase
      .from("favorites")
      .select("*", { head: true, count: "exact" })
      .eq("user_id", user.id),
    supabase
      .from("orders")
      .select("total_amount")
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("reviews")
      .select("*, items(name), canteens(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  const resolvedProfile: Profile = (profile as Profile) ?? {
    id: user.id,
    email: user.email ?? "",
    full_name: null,
    avatar_url: null,
    phone_number: null,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const totalSpend = (spendRows ?? []).reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  )

  const favoriteHighlights: FavoriteHighlight[] = (favorites ?? [])
    .map((favorite): FavoriteHighlight | null => {
      if (favorite.items) {
        return {
          id: favorite.id,
          type: "item",
          name: favorite.items.name,
          subtitle: favorite.items.canteens?.name ?? "Menu item",
          imageUrl: favorite.items.image_url,
        }
      }
      if (favorite.canteens) {
        return {
          id: favorite.id,
          type: "canteen",
          name: favorite.canteens.name,
          subtitle: "Canteen",
          imageUrl: favorite.canteens.banner_url ?? favorite.canteens.logo_url,
        }
      }
      return null
    })
    .filter((entry): entry is FavoriteHighlight => entry !== null)

  return (
    <AppShell title="Profile">
      <div className="space-y-6">
        <ProfileHero profile={resolvedProfile} user={user} />

        <ProfileStats
          stats={[
            {
              label: "Orders",
              value: totalOrdersCount ?? 0,
              subtext: "All time",
              icon: "bag",
            },
            {
              label: "Active",
              value: activeOrdersCount ?? 0,
              subtext: "In progress",
              icon: "ticket",
            },
            {
              label: "Saved",
              value: favoritesCount ?? 0,
              subtext: "Dishes & canteens",
              icon: "heart",
            },
            {
              label: "Spent",
              value: `₹${totalSpend.toFixed(0)}`,
              subtext: "On collected orders",
              icon: "wallet",
            },
          ]}
        />

        <ProfileLists
          recentOrders={(recentOrders ?? []) as OrderSummary[]}
          favorites={favoriteHighlights}
          feedbacks={(feedbacks ?? []) as FeedbackSummary[]}
        />

        <ProfileActions role={role} />
      </div>
    </AppShell>
  )
}
