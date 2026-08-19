import crypto from "node:crypto"
import { z } from "zod"
import {
  createSecureHandler,
  successResponse,
  errorResponse,
} from "@/lib/api/middleware"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRazorpayCredentials } from "@/lib/payments/razorpay-credentials"

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
})

// POST — called from the checkout success callback. The webhook
// (../../webhook) is the durable path if the browser never gets here.
export const POST = createSecureHandler({
  allowedRoles: ["canteen_owner", "admin"],
  schema,
  handler: async (request, { user, supabase, body }) => {
    const { keySecret } = await getRazorpayCredentials()
    if (!keySecret) {
      return errorResponse("Razorpay is not configured", 500)
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest("hex")

    const expectedBuf = Buffer.from(expected)
    const gotBuf = Buffer.from(body.razorpay_signature)
    const valid =
      expectedBuf.length === gotBuf.length &&
      crypto.timingSafeEqual(expectedBuf, gotBuf)

    if (!valid) {
      return errorResponse("Payment verification failed", 400)
    }

    // RLS scopes this to the caller's own canteen's banners.
    const { data: banner, error: bannerError } = await supabase
      .from("promo_banners")
      .select("id, amount_due, amount_paid")
      .eq("razorpay_order_id", body.razorpay_order_id)
      .single()

    if (bannerError || !banner) {
      return errorResponse("Banner not found", 404)
    }

    if (Number(banner.amount_paid) < Number(banner.amount_due)) {
      const admin = createAdminClient()
      const { error: updateError } = await admin
        .from("promo_banners")
        .update({
          amount_paid: banner.amount_due,
          payment_reference: body.razorpay_payment_id,
        })
        .eq("id", banner.id)

      if (updateError) {
        return errorResponse("Payment succeeded but the banner couldn't be updated", 500)
      }
    }

    return successResponse({ verified: true, banner_id: banner.id })
  },
})
