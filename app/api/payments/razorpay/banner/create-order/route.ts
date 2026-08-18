import { z } from "zod"
import {
  createSecureHandler,
  successResponse,
  errorResponse,
} from "@/lib/api/middleware"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRazorpay, toPaise } from "@/lib/payments/razorpay-server"

const schema = z.object({
  banner_id: z.string().uuid("Invalid banner ID"),
})

// POST — open (or resume) a Razorpay order for an approved banner slot.
//
// Payment only ever opens after content approval (see migration 048's
// comment for why): a rejected banner is never charged for. The amount is
// read from the row, never the request — amount_due is quoted by the
// database from the rate card at request time (and re-quoted if the owner
// moves the dates), so there's nothing here for a client to move.
export const POST = createSecureHandler({
  allowedRoles: ["canteen_owner", "admin"],
  schema,
  handler: async (request, { user, supabase, body }) => {
    // RLS scopes this to banners the caller's canteen owns (or all, for admin).
    const { data: banner, error: bannerError } = await supabase
      .from("promo_banners")
      .select("id, canteen_id, status, amount_due, amount_paid, razorpay_order_id")
      .eq("id", body.banner_id)
      .single()

    if (bannerError || !banner) {
      return errorResponse("Banner not found", 404)
    }

    if (banner.status !== "approved") {
      return errorResponse("This banner hasn't been approved yet", 400)
    }

    const owed = Number(banner.amount_due) - Number(banner.amount_paid)
    if (owed <= 0) {
      return errorResponse("This banner is already paid for", 400)
    }

    const amount = toPaise(owed)
    if (amount < 100) {
      return errorResponse("Amount is too small for online payment", 400)
    }

    const razorpay = getRazorpay()

    if (banner.razorpay_order_id) {
      try {
        const existing = await razorpay.orders.fetch(banner.razorpay_order_id)
        if (existing.status !== "paid" && existing.amount === amount) {
          return successResponse({
            razorpay_order_id: existing.id,
            amount: existing.amount,
            currency: existing.currency,
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          })
        }
      } catch {
        // Fall through and open a fresh one.
      }
    }

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: banner.id,
      notes: { banner_id: banner.id, canteen_id: banner.canteen_id, kind: "promo_banner" },
    })

    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from("promo_banners")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", banner.id)

    if (updateError) {
      return errorResponse("Could not start the payment", 500)
    }

    return successResponse({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  },
})
