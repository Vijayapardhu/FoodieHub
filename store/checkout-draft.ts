import { create } from "zustand"

/**
 * What was chosen on /cart, carried to /cart/confirm.
 *
 * Deliberately not persisted (localStorage/sessionStorage): a client-side
 * route push keeps this in memory across the navigation, and a direct visit
 * or refresh of the confirmation page with no draft just bounces back to
 * /cart — which is the right behaviour anyway, since the cart itself (and
 * its live availability) is the source of truth, not a snapshot of it.
 */
export interface CheckoutDraft {
  /** Scopes the order to one canteen, or null for "the whole cart". */
  canteenId: string | null
  paymentMethod: "on_shop" | "online"
  fulfillmentType: "pickup" | "delivery"
  deliveryBlockId: string | null
  deliveryFee: number
  offerId: string | null
  offerTitle: string | null
  discount: number
  specialInstructions: string
  dietaryNotes: string
  /** ISO string — a Date doesn't survive serialization cleanly. */
  scheduledPickupTime: string | null
  preferredTimeSlot: string | null
}

interface CheckoutDraftStore {
  draft: CheckoutDraft | null
  setDraft: (draft: CheckoutDraft) => void
  clearDraft: () => void
}

export const useCheckoutDraftStore = create<CheckoutDraftStore>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}))
