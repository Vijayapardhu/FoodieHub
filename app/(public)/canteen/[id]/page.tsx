import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { CanteenMenuPage } from "@/components/canteen/canteen-menu-page"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth/require-role"

export default async function CanteenPage({
  params,
}: {
  params: { id: string }
}) {
  const { supabase } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const { data: canteen, error: canteenError } = await supabase
    .from("canteens")
    .select("*")
    .eq("id", params.id)
    .single()

  if (canteenError) {
    console.error("[canteen] failed to fetch canteen", canteenError)
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("*, categories(name)")
    .eq("canteen_id", params.id)
    .order("name")

  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("*, users(full_name, avatar_url)")
    .eq("canteen_id", params.id)
    .order("created_at", { ascending: false })
    .limit(12)

  if (categoriesError) {
    console.error("[canteen] failed to fetch categories", categoriesError)
  }

  if (itemsError) {
    console.error("[canteen] failed to fetch items", itemsError)
  }
  if (reviewsError) {
    console.error("[canteen] failed to fetch reviews", reviewsError)
  }

  if (!canteen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-32">
        <Navbar />
        <div className="container px-4 py-10">
          <Card className="rounded-3xl border border-dashed border-orange-200 bg-white/80 p-8 text-center shadow-sm">
            <CardContent className="space-y-4">
              <p className="text-xl font-semibold text-foreground">
                This canteen is unavailable right now.
              </p>
              <p className="text-sm text-muted-foreground">
                It might have been removed or is temporarily offline. Please try
                again later.
              </p>
              <div className="flex justify-center">
                <Link href="/home">
                  <Button className="rounded-full bg-primary px-6 text-white hover:bg-primary/90">
                    Browse other canteens
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    )
  }

  const itemsWithCategories = items ?? []
  const featuredItems = itemsWithCategories.filter((item) => item.is_featured)
  const comboItems = itemsWithCategories.filter((item) => {
    const categoryName = (item as any).categories?.name?.toLowerCase?.() || ""
    return categoryName.includes("combo") || item.name.toLowerCase().includes("combo")
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-32">
      <Navbar />
      <CanteenMenuPage
        canteen={canteen}
        categories={categories ?? []}
        items={itemsWithCategories as any}
        featuredItems={featuredItems as any}
        comboItems={comboItems as any}
        reviews={(reviews ?? []) as any}
      />
      <BottomNav />
    </div>
  )
}
