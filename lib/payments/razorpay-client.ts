"use client"

import { APP_NAME } from "@/lib/utils/constants"

let scriptPromise: Promise<void> | null = null

function loadCheckoutScript(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).Razorpay) {
    return Promise.resolve()
  }
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Could not load Razorpay — check your connection"))
    document.body.appendChild(script)
  })
  return scriptPromise
}

export interface RazorpayCheckoutResult {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

/**
 * Opens Razorpay's hosted checkout popup and resolves with the payment
 * fields once the user completes it. Rejects if they close the popup or the
 * payment is declined — callers should treat that as "not paid yet", not as
 * the order having failed, since the order row already exists.
 */
export function openRazorpayCheckout(options: {
  keyId: string
  amount: number
  currency: string
  razorpayOrderId: string
  name: string
  description?: string
  prefill?: { name?: string | null; email?: string | null; contact?: string | null }
}): Promise<RazorpayCheckoutResult> {
  return loadCheckoutScript().then(
    () =>
      new Promise<RazorpayCheckoutResult>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: options.keyId,
          amount: options.amount,
          currency: options.currency,
          order_id: options.razorpayOrderId,
          name: options.name,
          description: options.description,
          prefill: {
            name: options.prefill?.name || undefined,
            email: options.prefill?.email || undefined,
            contact: options.prefill?.contact || undefined,
          },
          theme: { color: "#2f7f5c" },
          handler: (response: RazorpayCheckoutResult) => resolve(response),
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        })
        rzp.on("payment.failed", () => reject(new Error("Payment failed")))
        rzp.open()
      })
  )
}

/**
 * The full round trip for one order: open a Razorpay order for it, collect
 * payment in the popup, verify the result. Used both right after placing an
 * order and to retry payment on an order that's still sitting unpaid.
 *
 * Throws on cancellation, decline, or a failed verification — in every case
 * the order itself is untouched and still there to retry.
 */
export async function payForOrder(params: {
  orderId: string
  canteenName: string
  prefill?: { name?: string | null; email?: string | null; contact?: string | null }
}): Promise<{ token: string }> {
  const createRes = await fetch("/api/payments/razorpay/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: params.orderId }),
  })
  const created = await createRes.json()
  if (!createRes.ok || !created.success) {
    throw new Error(created.error || "Could not start payment")
  }

  const { razorpay_order_id, amount, currency, key_id } = created.data

  const result = await openRazorpayCheckout({
    keyId: key_id,
    amount,
    currency,
    razorpayOrderId: razorpay_order_id,
    name: APP_NAME,
    description: `Order at ${params.canteenName}`,
    prefill: params.prefill,
  })

  const verifyRes = await fetch("/api/payments/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  })
  const verified = await verifyRes.json()
  if (!verifyRes.ok || !verified.success) {
    throw new Error(verified.error || "Payment could not be verified")
  }

  return { token: verified.data.token }
}

/** Same round trip as payForOrder, against a promo banner slot instead of an order. */
export async function payForBanner(params: {
  bannerId: string
  headline: string
}): Promise<{ bannerId: string }> {
  const createRes = await fetch("/api/payments/razorpay/banner/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ banner_id: params.bannerId }),
  })
  const created = await createRes.json()
  if (!createRes.ok || !created.success) {
    throw new Error(created.error || "Could not start payment")
  }

  const { razorpay_order_id, amount, currency, key_id } = created.data

  const result = await openRazorpayCheckout({
    keyId: key_id,
    amount,
    currency,
    razorpayOrderId: razorpay_order_id,
    name: APP_NAME,
    description: `Banner — ${params.headline}`,
  })

  const verifyRes = await fetch("/api/payments/razorpay/banner/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  })
  const verified = await verifyRes.json()
  if (!verifyRes.ok || !verified.success) {
    throw new Error(verified.error || "Payment could not be verified")
  }

  return { bannerId: verified.data.banner_id }
}
