import { createClient } from "@/lib/supabase/server"
import { offerBadge, type PromoPlacement, type PromoSlide } from "@/lib/utils/promo-banners"
import { PromoCarousel } from "@/components/home/promo-carousel"
import { PromoStrip } from "@/components/promo/promo-strip"

interface PromoSlotProps {
  placement: PromoPlacement
  /** How many banners to rotate. The compact strip only ever shows one. */
  limit?: number
  className?: string
}

/**
 * Renders whatever advertising is live for a placement, or nothing at all.
 *
 * Server-side so an empty slot costs no JavaScript on the client — most
 * placements are unsold most of the time, and an unsold slot should be
 * invisible rather than a gap with a spinner in it.
 */
export async function PromoSlot({
  placement,
  limit = 6,
  className,
}: PromoSlotProps) {
  const nowIso = new Date().toISOString()

  let banners: any[] = []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("promo_banners")
      .select(
        "id, headline, subtext, image_url, cta_label, canteen_id, canteens(*), offers(discount_type, discount_value)"
      )
      .eq("placement", placement)
      .eq("status", "approved")
      .lte("starts_at", nowIso)
      .gte("ends_at", nowIso)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit)

    // Migration 025 adds `placement`; until it runs the filter is invalid and
    // the slot simply stays empty rather than taking the page down with it.
    if (error) return null
    banners = data ?? []
  } catch {
    return null
  }

  const slides: PromoSlide[] = banners
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

  if (slides.length === 0) return null

  if (placement === "home_hero") {
    return <PromoCarousel slides={slides} />
  }

  return <PromoStrip slides={slides} className={className} />
}
