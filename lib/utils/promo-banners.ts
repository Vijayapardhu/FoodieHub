import { Database } from "@/types/database.types"

export type PromoBanner = Database["public"]["Tables"]["promo_banners"]["Row"]

export type PromoBannerStatus = PromoBanner["status"]

/** A banner joined with the names the consoles display alongside it. */
export type PromoBannerWithCanteen = PromoBanner & {
  canteens: { id: string; name: string; is_open: boolean } | null
  offers: { id: string; title: string } | null
}

/** What the home carousel needs — deliberately narrower than the whole row. */
export interface PromoSlide {
  id: string
  headline: string
  subtext: string | null
  imageUrl: string | null
  ctaLabel: string
  canteenId: string
  canteenSlug: string | null
  canteenName: string
  canteenOpen: boolean
  offerLabel: string | null
}

export type PromoPlacement = "home_hero" | "home_inline" | "orders" | "cart"

/**
 * The inventory a canteen can buy, cheapest attention last. `multiplier` is
 * applied to the daily rate — the database applies the same numbers in
 * `promo_placement_multiplier()`, and these are what the owner is quoted.
 */
export const PROMO_PLACEMENTS: Array<{
  value: PromoPlacement
  label: string
  description: string
  multiplier: number
}> = [
  {
    value: "home_hero",
    label: "Home carousel",
    description:
      "The banner at the top of every student's home screen. The most seen slot on the platform.",
    multiplier: 1,
  },
  {
    value: "home_inline",
    label: "Home — mid page",
    description:
      "A strip between the category tiles and the canteen list, seen while browsing.",
    multiplier: 0.5,
  },
  {
    value: "orders",
    label: "Order tracking",
    description:
      "Under a live order, read by somebody who is already waiting for food.",
    multiplier: 0.5,
  },
  {
    value: "cart",
    label: "Cart",
    description: "Beside the bill, moments before the order is placed.",
    multiplier: 0.5,
  },
]

export function placementMeta(placement: string) {
  return (
    PROMO_PLACEMENTS.find((entry) => entry.value === placement) ??
    PROMO_PLACEMENTS[0]
  )
}

export const PROMO_STATUS_LABELS: Record<PromoBannerStatus, string> = {
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
  paused: "Paused",
}

/**
 * A slot is charged per day, rounded up: half a day of exposure still occupies
 * the carousel for that day's lunch rush, so it bills as one.
 */
export const MS_PER_DAY = 86_400_000

export function slotDays(startsAt: string | Date, endsAt: string | Date) {
  const from = new Date(startsAt).getTime()
  const until = new Date(endsAt).getTime()
  if (!Number.isFinite(from) || !Number.isFinite(until) || until <= from) return 0
  return Math.ceil((until - from) / MS_PER_DAY)
}

export function slotCost(
  startsAt: string | Date,
  endsAt: string | Date,
  dailyRate: number,
  placement: string = "home_hero"
) {
  return Math.round(
    slotDays(startsAt, endsAt) * dailyRate * placementMeta(placement).multiplier
  )
}

/** Approved, paid for or not, and inside its booked window. */
export function isLive(banner: Pick<PromoBanner, "status" | "starts_at" | "ends_at">) {
  const now = Date.now()
  return (
    banner.status === "approved" &&
    new Date(banner.starts_at).getTime() <= now &&
    new Date(banner.ends_at).getTime() >= now
  )
}

export function hasExpired(banner: Pick<PromoBanner, "ends_at">) {
  return new Date(banner.ends_at).getTime() < Date.now()
}

/** Click-through rate as a percentage, or null while nothing has been shown. */
export function clickThroughRate(banner: Pick<PromoBanner, "impressions" | "clicks">) {
  if (!banner.impressions) return null
  return (banner.clicks / banner.impressions) * 100
}

export function formatRupees(amount: number) {
  return `₹${Number(amount).toLocaleString("en-IN", {
    maximumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2,
  })}`
}

/** "20% off" / "₹50 off" — the badge a linked offer contributes to a slide. */
export function offerBadge(
  offer: { discount_type: "percentage" | "flat"; discount_value: number } | null
) {
  if (!offer) return null
  return offer.discount_type === "percentage"
    ? `${offer.discount_value}% off`
    : `₹${offer.discount_value} off`
}
