import { Database } from "@/types/database.types"

type Offer = Database["public"]["Tables"]["offers"]["Row"]

/**
 * Calculate discount amount for an offer
 */
export function calculateDiscount(
  offer: Offer,
  orderAmount: number
): number {
  if (!offer.is_active || !offer.is_approved) {
    return 0
  }

  const now = new Date()
  const validFrom = new Date(offer.valid_from)
  const validUntil = new Date(offer.valid_until)

  if (now < validFrom || now > validUntil) {
    return 0
  }

  if (offer.min_order_amount && orderAmount < offer.min_order_amount) {
    return 0
  }

  let discount = 0

  if (offer.discount_type === "percentage") {
    discount = (orderAmount * offer.discount_value) / 100
    if (offer.max_discount) {
      discount = Math.min(discount, offer.max_discount)
    }
  } else {
    discount = offer.discount_value
  }

  return Math.min(discount, orderAmount)
}

/**
 * Get applicable offers for a canteen
 */
export async function getApplicableOffers(
  canteenId: string,
  orderAmount: number
): Promise<Offer[]> {
  // This would typically be a database query
  // For now, return empty array - will be implemented with actual query
  return []
}

/**
 * Find best offer for an order
 */
export function findBestOffer(
  offers: Offer[],
  orderAmount: number
): { offer: Offer; discount: number } | null {
  let bestOffer: { offer: Offer; discount: number } | null = null

  for (const offer of offers) {
    const discount = calculateDiscount(offer, orderAmount)
    if (
      discount > 0 &&
      (!bestOffer || discount > bestOffer.discount)
    ) {
      bestOffer = { offer, discount }
    }
  }

  return bestOffer
}

