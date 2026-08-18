import { z } from "zod"
import {
  createSecureHandler,
  successResponse,
  errorResponse,
} from "@/lib/api/middleware"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRazorpay, toPaise } from "@/lib/payments/razorpay-server"

const schema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
})

// POST — open (or resume) a Razorpay order for one of our orders.
//
// The amount charged is read from `orders.total_amount` on our side, never
// from the request: that column is server-authoritative (recomputed by a
// trigger from the order's lines and offer — see migration 032), so this is
// the one place a client can't move the price by editing a request body.
export const POST = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  schema,
  handler: async (request, { user, supabase, body }) => {
    // RLS scopes this to orders the caller owns.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, token, total_amount, payment_method, payment_status, razorpay_order_id")
      .eq("id", body.order_id)
      .single()

    if (orderError || !order) {
      return errorResponse("Order not found", 404)
    }

    if (order.payment_method !== "online") {
      return errorResponse("This order isn't set up for online payment", 400)
    }

    if (order.payment_status === "completed") {
      return errorResponse("This order is already paid", 400)
    }

    const amount = toPaise(Number(order.total_amount))
    if (amount < 100) {
      // Razorpay's own floor (₹1). An order this small shouldn't reach
      // checkout, but fail loudly rather than send Razorpay a bad request.
      return errorResponse("Order amount is too small for online payment", 400)
    }

    const razorpay = getRazorpay()

    // A retry (page refresh, popup dismissed and reopened) should resume the
    // same Razorpay order rather than mint a new one every time — Razorpay
    // itself would happily create duplicates, but only one should ever end
    // up attached to this row.
    if (order.razorpay_order_id) {
      try {
        const existing = await razorpay.orders.fetch(order.razorpay_order_id)
        if (existing.status !== "paid" && existing.amount === amount) {
          return successResponse({
            razorpay_order_id: existing.id,
            amount: existing.amount,
            currency: existing.currency,
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          })
        }
      } catch {
        // Couldn't be fetched (e.g. lives in a different Razorpay mode) —
        // fall through and open a fresh one.
      }
    }

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: order.token,
      notes: { order_id: order.id, user_id: user.id },
    })

    // Only the service role can write payment fields (see migration 047) —
    // deliberately not writable by the order's own owner.
    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", order.id)

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
