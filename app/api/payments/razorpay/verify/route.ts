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

// POST — called from the checkout success callback, right after Razorpay's
// popup closes. This is the fast path that marks an order paid without
// waiting on the webhook; the webhook (app/api/payments/razorpay/webhook)
// is what makes the payment durable if the browser never gets to call this
// at all (closed tab, network drop) — both write the same two columns, and
// both are safe to run more than once.
export const POST = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
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

    // RLS scopes this to the caller's own orders — nobody can mark someone
    // else's order paid by guessing a razorpay_order_id.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, token, payment_status")
      .eq("razorpay_order_id", body.razorpay_order_id)
      .eq("user_id", user.id)
      .single()

    if (orderError || !order) {
      return errorResponse("Order not found", 404)
    }

    if (order.payment_status !== "completed") {
      const admin = createAdminClient()
      const { error: updateError } = await admin
        .from("orders")
        .update({
          payment_status: "completed",
          razorpay_payment_id: body.razorpay_payment_id,
        })
        .eq("id", order.id)

      if (updateError) {
        return errorResponse("Payment succeeded but the order couldn't be updated", 500)
      }
    }

    return successResponse({ verified: true, token: order.token })
  },
})
