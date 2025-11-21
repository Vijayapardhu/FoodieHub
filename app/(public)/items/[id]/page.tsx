import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { requireRole } from "@/lib/auth/require-role"
import { ItemDetail } from "@/components/menu/item-detail"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ItemDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { supabase } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("*")
    .eq("id", params.id)
    .maybeSingle()

  if (itemError) {
    console.error("[item-detail] failed to fetch item", itemError)
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-24">
        <Navbar />
        <div className="container px-4 py-10">
          <Card className="rounded-3xl border border-dashed border-orange-200 bg-white/80 p-8 text-center shadow-sm">
            <CardContent className="space-y-4">
              <p className="text-xl font-semibold text-foreground">
                This dish is resting right now.
              </p>
              <p className="text-sm text-muted-foreground">
                It may have been removed or is temporarily unavailable. Try
                exploring the canteen menu.
              </p>
              <div className="flex justify-center">
                <Link href="/home">
                  <Button className="rounded-full bg-primary px-6 text-white hover:bg-primary/90">
                    Discover dishes
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

  const [{ data: canteen }, { data: category }, { data: relatedItems }] =
    await Promise.all([
      supabase.from("canteens").select("*").eq("id", item.canteen_id).maybeSingle(),
      supabase.from("categories").select("name").eq("id", item.category_id).maybeSingle(),
      supabase
        .from("items")
        .select("*")
        .eq("canteen_id", item.canteen_id)
        .eq("category_id", item.category_id)
        .neq("id", item.id)
        .order("is_featured", { ascending: false })
        .limit(8),
    ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-24">
      <Navbar />
      <main className="container px-4 py-6">
        <ItemDetail
          item={item}
          canteen={canteen ?? null}
          categoryName={category?.name}
          relatedItems={relatedItems ?? []}
        />
      </main>
      <BottomNav />
    </div>
  )
}

