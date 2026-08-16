import { AppShell } from "@/components/layout/app-shell"
import { FavoritesList } from "@/components/favorites/favorites-list"
import { requireRole } from "@/lib/auth/require-role"

export const metadata = { title: "Saved" }

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

  if (error) console.error("[favorites] fetch failed", error)

  return (
    <AppShell title="Saved">
      <FavoritesList favorites={(favorites ?? []) as any} />
    </AppShell>
  )
}
