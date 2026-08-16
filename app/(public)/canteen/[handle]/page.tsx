import type { Metadata } from "next"
import { Store } from "@/components/ui/icons"
import { AppShell } from "@/components/layout/app-shell"
import { CanteenMenuPage } from "@/components/canteen/canteen-menu-page"
import { EmptyState } from "@/components/ui/empty-state"
import { requireRole } from "@/lib/auth/require-role"
import { createClient } from "@/lib/supabase/server"
import { lookupColumn } from "@/lib/utils/public-id"

/**
 * The tab title and any shared link should name the canteen. "Menu" tells a
 * student with six tabs open nothing at all.
 */
export async function generateMetadata({
  params,
}: {
  params: { handle: string }
}): Promise<Metadata> {
  try {
    const supabase = await createClient()
    const { data: canteen } = await supabase
      .from("canteens")
      .select("name, description, banner_url, logo_url")
      .eq(lookupColumn(params.handle), params.handle)
      .maybeSingle()

    if (!canteen) return { title: "Canteen" }

    const description =
      canteen.description || `Order ahead from ${canteen.name} and skip the queue.`
    const image = canteen.banner_url ?? canteen.logo_url ?? undefined

    return {
      title: canteen.name,
      description,
      openGraph: {
        title: canteen.name,
        description,
        images: image ? [image] : undefined,
      },
    }
  } catch {
    return { title: "Canteen" }
  }
}

export default async function CanteenPage({
  params,
}: {
  params: { handle: string }
}) {
  const { supabase } = await requireRole(["user", "canteen_owner", "admin"])

  // A slug in the URL, a uuid from an older link — both resolve here, so
  // links shared before migration 024 keep working.
  const { data: canteen, error: canteenError } = await supabase
    .from("canteens")
    .select("*")
    .eq(lookupColumn(params.handle), params.handle)
    .maybeSingle()

  if (canteenError) console.error("[canteen] canteen", canteenError)

  if (!canteen) {
    return (
      <AppShell showBack title="Canteen">
        <EmptyState
          icon={Store}
          title="This canteen isn't available"
          description="It may have been removed or is temporarily offline."
          action={{ label: "Browse other canteens", href: "/home" }}
        />
      </AppShell>
    )
  }

  const [
    { data: categories, error: categoriesError },
    { data: items, error: itemsError },
    { data: reviews, error: reviewsError },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("items")
      .select("*, categories(name)")
      .eq("canteen_id", canteen.id)
      .order("name"),
    supabase
      .from("reviews")
      .select("*, users(full_name, avatar_url)")
      .eq("canteen_id", canteen.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ])

  if (categoriesError) console.error("[canteen] categories", categoriesError)
  if (itemsError) console.error("[canteen] items", itemsError)
  if (reviewsError) console.error("[canteen] reviews", reviewsError)

  const menu = items ?? []
  const featuredItems = menu.filter((item) => item.is_featured)
  const comboItems = menu.filter((item) => {
    const categoryName =
      (item as any).categories?.name?.toLowerCase?.() ?? ""
    return (
      categoryName.includes("combo") || item.name.toLowerCase().includes("combo")
    )
  })

  return (
    <AppShell hideAppBar bottomPad="action-bar">
      <CanteenMenuPage
        canteen={canteen}
        categories={categories ?? []}
        items={menu as any}
        featuredItems={featuredItems as any}
        comboItems={comboItems as any}
        reviews={(reviews ?? []) as any}
      />
    </AppShell>
  )
}
