import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ProfileHero } from "@/components/profile/profile-hero"
import { ProfileStats } from "@/components/profile/profile-stats"
import { ProfileLists } from "@/components/profile/profile-lists"
import { Database } from "@/types/database.types"
import { LogoutButton } from "@/components/profile/logout-button"
import { requireRole } from "@/lib/auth/require-role"

type Profile = Database["public"]["Tables"]["users"]["Row"]
type OrderSummary =
  Database["public"]["Tables"]["orders"]["Row"] & {
    canteens: { name: string } | null
  }
type FavoriteHighlight = {
  id: string
  type: "item" | "canteen"
  name: string
  subtitle?: string
  imageUrl?: string | null
}
type FeedbackSummary =
  Database["public"]["Tables"]["reviews"]["Row"] & {
    items: { name: string } | null
    canteens: { name: string } | null
  }

export default async function ProfilePage() {
  const { supabase, user } = await requireRole([
    "student",
    "canteen_owner",
    "admin",
  ])

  const profilePromise = supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  const recentOrdersPromise = supabase
    .from("orders")
    .select(
      `
        *,
        canteens:canteens(
          id,
          name,
          contact_phone
        )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4)

  const favoritesPromise = supabase
    .from("favorites")
    .select("*, items(*, canteens(name)), canteens(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6)

  const totalOrdersPromise = supabase
    .from("orders")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", user.id)

  const activeOrdersPromise = supabase
    .from("orders")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed", "preparing", "ready"])

  const favoritesCountPromise = supabase
    .from("favorites")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", user.id)

  const totalSpendPromise = supabase
    .from("orders")
    .select("total_amount")
    .eq("user_id", user.id)

const feedbackPromise = supabase
  .from("reviews")
  .select("*, items(name), canteens(name)")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(4)

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
    profilePromise,
    recentOrdersPromise,
    favoritesPromise,
    totalOrdersPromise,
    activeOrdersPromise,
    favoritesCountPromise,
    totalSpendPromise,
    feedbackPromise,
  ])

  const resolvedProfile: Profile =
    (profile as Profile) ?? {
      id: user.id,
      email: user.email ?? "",
      full_name: null,
      avatar_url: null,
      phone_number: null,
      role: "student",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

  const totalSpend = (spendRows || []).reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  )

  const favoriteHighlights: FavoriteHighlight[] =
    (favorites
      ?.map((fav) => {
        if (fav.items) {
          return {
            id: fav.id,
            type: "item" as const,
            name: fav.items.name,
            subtitle: fav.items.canteens?.name || "Menu item",
            imageUrl: fav.items.image_url,
          }
        }
        if (fav.canteens) {
          return {
            id: fav.id,
            type: "canteen" as const,
            name: fav.canteens.name,
            subtitle: "Canteen",
            imageUrl: fav.canteens.banner_url || fav.canteens.logo_url,
          }
        }
        return null
      })
      .filter(Boolean) as FavoriteHighlight[]) ?? []

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white pb-20">
      <Navbar />
      <div className="container px-4 py-6">
        <ProfileHero
          profile={resolvedProfile}
          user={user}
          activeOrders={activeOrdersCount || 0}
        totalSpend={totalSpend}
        />

        <ProfileStats
          stats={[
            {
              label: "Orders",
              value: totalOrdersCount || 0,
              subtext: "All time",
              icon: "bag",
            },
            {
              label: "Favorites",
              value: favoritesCount || 0,
              subtext: "Saved places",
              icon: "heart",
            },
            {
              label: "Active tokens",
              value: activeOrdersCount || 0,
              subtext: "Ready & cooking",
              icon: "ticket",
            },
            {
              label: "Total spend",
              value: `₹${totalSpend.toFixed(0)}`,
              subtext: "Lifetime",
              icon: "wallet",
            },
          ]}
        />

        <ProfileLists
          recentOrders={(recentOrders as OrderSummary[]) || []}
          favorites={favoriteHighlights}
          feedbacks={(feedbacks as FeedbackSummary[]) || []}
        />

        <div className="mt-8">
          <LogoutButton className="w-full rounded-2xl border border-orange-100 bg-white py-3 text-primary shadow-sm" />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

