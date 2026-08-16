import { AppShell } from "@/components/layout/app-shell"
import { HomePageContent } from "@/components/home/home-page-content"
import { ReorderRail, type UsualOrder } from "@/components/home/reorder-rail"
import { requireRole } from "@/lib/auth/require-role"
import { offerBadge, type PromoSlide } from "@/lib/utils/promo-banners"
import { PromoSlot } from "@/components/promo/promo-slot"
import {
  ActiveOrderCard,
  type ActiveOrder,
} from "@/components/home/active-order-card"
import { ACTIVE_ORDER_STATUSES } from "@/lib/utils/order-status"

export const metadata = { title: "Home" }

export default async function HomePage() {
  const { supabase, user } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const nowIso = new Date().toISOString()

  const [
    { data: canteens, error: canteensError },
    { data: featuredItems, error: featuredError },
    { data: categories, error: categoriesError },
    { data: items, error: itemsError },
    { data: profile },
    { data: banners, error: bannersError },
    { data: liveOrder },
    { data: lastOrder },
  ] = await Promise.all([
    supabase.from("canteens").select("*").order("rating", { ascending: false }),
    supabase
      .from("items")
      .select("*, canteens(*)")
      .eq("is_available", true)
      .eq("is_featured", true)
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase.from("categories").select("*").order("name"),
    // Powers cross-canteen dish search without a round trip per keystroke.
    supabase
      .from("items")
      .select("*, canteens(*)")
      .eq("is_available", true)
      .order("rating", { ascending: false })
      .limit(300),
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
    // Paid banner slots. RLS already hides anything unapproved or out of
    // window; the filters keep the index in play and make that explicit.
    supabase
      .from("promo_banners")
      .select(
        "id, headline, subtext, image_url, cta_label, canteen_id, canteens(*), offers(discount_type, discount_value)"
      )
      .eq("status", "approved")
      .lte("starts_at", nowIso)
      .gte("ends_at", nowIso)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(6),
    // Anything being cooked right now gets pinned to the top of the screen.
    supabase
      .from("orders")
      .select("id, token, status, created_at, estimated_preparation_time, scheduled_pickup_time, canteens(name), order_items(quantity)")
      .eq("user_id", user.id)
      .in("status", ACTIVE_ORDER_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Most recent order, for the one-tap "your usual" rail.
    supabase
      .from("orders")
      .select(
        "id, canteen_id, total_amount, created_at, canteens(*), order_items(quantity, price, items(*))"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const active: ActiveOrder | null = liveOrder
    ? {
        id: (liveOrder as any).id,
        token: (liveOrder as any).token,
        status: (liveOrder as any).status,
        canteenName: (liveOrder as any).canteens?.name ?? "Canteen",
        itemCount: ((liveOrder as any).order_items ?? []).reduce(
          (sum: number, line: any) => sum + line.quantity,
          0
        ),
        createdAt: (liveOrder as any).created_at,
        prepMinutes: (liveOrder as any).estimated_preparation_time ?? null,
        scheduledFor: (liveOrder as any).scheduled_pickup_time ?? null,
      }
    : null

  const usual: UsualOrder | null =
    lastOrder && (lastOrder as any).order_items?.length
      ? {
          orderId: (lastOrder as any).id,
          canteenId: (lastOrder as any).canteen_id,
          canteenSlug: (lastOrder as any).canteens?.slug ?? null,
          canteenName: (lastOrder as any).canteens?.name ?? "Canteen",
          total: Number((lastOrder as any).total_amount),
          placedAt: (lastOrder as any).created_at,
          items: (lastOrder as any).order_items
            .filter((line: any) => line.items)
            .map((line: any) => ({
              itemId: line.items.id,
              itemSlug: line.items.slug ?? null,
              name: line.items.name,
              price: Number(line.price),
              imageUrl: line.items.image_url,
              quantity: line.quantity,
              available: line.items.is_available,
            })),
        }
      : null

  // A banner whose canteen came back null was pulled from an unapproved or
  // deleted canteen — RLS hid the join, and there is nowhere to send a tap.
  const promos: PromoSlide[] = ((banners ?? []) as any[])
    .filter((banner) => banner.canteens)
    .map((banner) => ({
      id: banner.id,
      headline: banner.headline,
      subtext: banner.subtext,
      imageUrl: banner.image_url,
      ctaLabel: banner.cta_label,
      canteenId: banner.canteen_id,
      canteenSlug: banner.canteens.slug ?? null,
      canteenName: banner.canteens.name,
      canteenOpen: banner.canteens.is_open,
      offerLabel: offerBadge(banner.offers ?? null),
    }))

  if (canteensError) console.error("[home] canteens", canteensError)
  if (bannersError) console.error("[home] promo banners", bannersError)
  if (featuredError) console.error("[home] featured items", featuredError)
  if (categoriesError) console.error("[home] categories", categoriesError)
  if (itemsError) console.error("[home] items", itemsError)

  return (
    <AppShell>
      <HomePageContent
        canteens={canteens ?? []}
        featuredItems={(featuredItems ?? []) as any}
        categories={categories ?? []}
        items={(items ?? []) as any}
        promos={promos}
        greetingName={profile?.full_name ?? null}
        reorder={usual ? <ReorderRail usual={usual} /> : null}
        activeOrder={active ? <ActiveOrderCard order={active} /> : null}
        inlinePromo={<PromoSlot placement="home_inline" />}
      />
    </AppShell>
  )
}
