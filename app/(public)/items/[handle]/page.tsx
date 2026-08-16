import type { Metadata } from "next"
import { UtensilsCrossed } from "@/components/ui/icons"
import { AppShell } from "@/components/layout/app-shell"
import { PromoSlot } from "@/components/promo/promo-slot"
import { ItemDetail } from "@/components/menu/item-detail"
import { EmptyState } from "@/components/ui/empty-state"
import { requireRole } from "@/lib/auth/require-role"
import { createClient } from "@/lib/supabase/server"
import { lookupColumn } from "@/lib/utils/public-id"

export async function generateMetadata({
  params,
}: {
  params: { handle: string }
}): Promise<Metadata> {
  try {
    const supabase = await createClient()
    const { data: item } = await supabase
      .from("items")
      .select("name, description, price, image_url, canteens(name)")
      .eq(lookupColumn(params.handle), params.handle)
      .maybeSingle()

    if (!item) return { title: "Dish" }

    const canteenName = (item as any).canteens?.name
    const description =
      item.description ||
      `₹${Number(item.price)}${canteenName ? ` at ${canteenName}` : ""}`

    return {
      title: canteenName ? `${item.name} · ${canteenName}` : item.name,
      description,
      openGraph: {
        title: item.name,
        description,
        images: item.image_url ? [item.image_url] : undefined,
      },
    }
  } catch {
    return { title: "Dish" }
  }
}

export default async function ItemDetailPage({
  params,
}: {
  params: { handle: string }
}) {
  const { supabase } = await requireRole(["user", "canteen_owner", "admin"])

  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("*")
    .eq(lookupColumn(params.handle), params.handle)
    .maybeSingle()

  if (itemError) console.error("[item-detail] item", itemError)

  if (!item) {
    return (
      <AppShell showBack title="Dish">
        <EmptyState
          icon={UtensilsCrossed}
          title="This dish isn't on the menu"
          description="It may have been removed or is temporarily unavailable."
          action={{ label: "Browse dishes", href: "/home" }}
        />
      </AppShell>
    )
  }

  const [{ data: canteen }, { data: category }, { data: relatedItems }] =
    await Promise.all([
      supabase
        .from("canteens")
        .select("*")
        .eq("id", item.canteen_id)
        .maybeSingle(),
      supabase
        .from("categories")
        .select("name")
        .eq("id", item.category_id)
        .maybeSingle(),
      supabase
        .from("items")
        .select("*")
        .eq("canteen_id", item.canteen_id)
        .eq("is_available", true)
        .neq("id", item.id)
        .order("is_featured", { ascending: false })
        .limit(8),
    ])

  return (
    <AppShell hideAppBar bottomPad="action-bar">
      <ItemDetail
        item={item}
        canteen={canteen ?? null}
        categoryName={category?.name}
        relatedItems={relatedItems ?? []}
        promo={<PromoSlot placement="item_detail" limit={1} />}
      />
    </AppShell>
  )
}
