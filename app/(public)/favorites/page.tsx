import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { FavoritesList } from "@/components/favorites/favorites-list"
import { requireRole } from "@/lib/auth/require-role"

export default async function FavoritesPage() {
  const { supabase, user } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("*, items(*, canteens(name)), canteens(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[favorites] failed to fetch favorites", error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 pb-20">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            Favorites
          </h1>
          <p className="text-sm text-muted-foreground">
            Keep tabs on dishes and canteens you love. Add them to the cart in one tap.
          </p>
        </div>
        <FavoritesList favorites={favorites ?? []} loading={Boolean(error)} />
      </div>
      <BottomNav />
    </div>
  )
}
