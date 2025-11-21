import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { HomePageContent } from "@/components/home/home-page-content"
import { requireRole } from "@/lib/auth/require-role"

export default async function HomePage() {
  const { supabase } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const { data: canteens, error: canteensError } = await supabase
    .from("canteens")
    .select("*")
    .order("rating", { ascending: false })

  const { data: featuredItems, error: featuredError } = await supabase
    .from("items")
    .select("*, canteens(name)")
    .eq("is_available", true)
    .eq("is_featured", true)
    .order("updated_at", { ascending: false })
    .limit(6)

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  if (canteensError) {
    console.error("[home] failed to fetch canteens", canteensError)
  }
  if (featuredError) {
    console.error("[home] failed to fetch featured items", featuredError)
  }
  if (categoriesError) {
    console.error("[home] failed to fetch categories", categoriesError)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 pb-20">
      <Navbar />
      <HomePageContent
        canteens={canteens ?? []}
        featuredItems={featuredItems ?? []}
        categories={categories ?? []}
      />
      <BottomNav />
    </div>
  )
}
