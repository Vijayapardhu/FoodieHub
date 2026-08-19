import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRazorpayCredentials } from "@/lib/payments/razorpay-credentials"

/**
 * Razorpay → us, server-to-server. No Supabase session exists here, so the
 * caller's identity is the signature, not a cookie — register this URL at
 * Dashboard → Settings → Webhooks with the events `payment.captured` and
 * `payment.failed`, and put the secret you set there in
 * RAZORPAY_WEBHOOK_SECRET.
 *
 * This is the durable path: the browser-side verify route (../verify)
 * covers the common case, but a closed tab or a dropped connection after a
 * successful charge would otherwise leave an order stuck "pending" forever
 * with the customer already billed. Both write the same columns and both
 * tolerate running twice, so it doesn't matter which gets there first.
 */
export async function POST(request: NextRequest) {
  const { webhookSecret } = await getRazorpayCredentials()
  if (!webhookSecret) {
    console.error("Razorpay webhook secret is not set")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  // The signature is over the exact raw bytes Razorpay sent — has to be
  // read as text before any JSON parsing touches it.
  const rawBody = await request.text()
  const signature = request.headers.get("x-razorpay-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex")
  const expectedBuf = Buffer.from(expected)
  const gotBuf = Buffer.from(signature)
  const valid =
    expectedBuf.length === gotBuf.length && crypto.timingSafeEqual(expectedBuf, gotBuf)

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const eventType: string | undefined = event.event
  const payment = event.payload?.payment?.entity

  if (!payment?.order_id || !payment?.id) {
    // Nothing this handler cares about (e.g. a refund or order event). Not
    // an error — just acknowledge it so Razorpay doesn't retry forever.
    return NextResponse.json({ received: true })
  }

  if (eventType !== "payment.captured" && eventType !== "payment.failed") {
    return NextResponse.json({ received: true })
  }

  const admin = createAdminClient()
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, payment_status")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle()

  if (orderError) {
    // Genuinely transient (DB hiccup) — ask Razorpay to retry.
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 })
  }

  if (order) {
    // A captured payment is final; never let a late/out-of-order failure
    // webhook downgrade an order that's already been paid.
    if (order.payment_status === "completed") {
      return NextResponse.json({ received: true })
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({
        payment_status: eventType === "payment.captured" ? "completed" : "failed",
        razorpay_payment_id: payment.id,
      })
      .eq("id", order.id)

    if (updateError) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }

    return NextResponse.json({ received: true })
  }

  // Not a food order — a promo banner slot, maybe. Unlike an order, a
  // banner has no "failed" state to record: it simply stays unpaid and the
  // owner can retry, so a failed payment here is a no-op.
  if (eventType === "payment.captured") {
    const { data: banner, error: bannerError } = await admin
      .from("promo_banners")
      .select("id, amount_due, amount_paid")
      .eq("razorpay_order_id", payment.order_id)
      .maybeSingle()

    if (bannerError) {
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 })
    }

    if (banner && Number(banner.amount_paid) < Number(banner.amount_due)) {
      const { error: updateError } = await admin
        .from("promo_banners")
        .update({
          amount_paid: banner.amount_due,
          payment_reference: payment.id,
        })
        .eq("id", banner.id)

      if (updateError) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
      }
    }
  }

  // Either matched nothing (no order or banner was ever attached to this
  // Razorpay order id — retrying won't change that) or was already handled
  // above.
  return NextResponse.json({ received: true })
}
