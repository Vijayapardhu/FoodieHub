import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { FavoritesList } from "@/components/favorites/favorites-list"
import { requireRole } from "@/lib/auth/require-role"

export default async function FavoritesPage() {
  const { supabase, user } = await requireRole([
    "student",
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
    <div className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Favorites</h1>
        <p className="text-sm text-muted-foreground">
          Keep tabs on dishes and canteens you love. Add them to the cart in one tap.
        </p>
        <FavoritesList favorites={favorites ?? []} loading={Boolean(error)} />
      </div>
      <BottomNav />
    </div>
  )
}
