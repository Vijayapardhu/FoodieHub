import Razorpay from "razorpay"

let instance: Razorpay | null = null

/** Server-only. Throws rather than silently no-op'ing if keys are missing. */
export function getRazorpay(): Razorpay {
  if (instance) return instance

  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET

  if (!key_id || !key_secret) {
    throw new Error("Razorpay is not configured (missing key id or key secret)")
  }

  instance = new Razorpay({ key_id, key_secret })
  return instance
}

/** Razorpay takes amounts as integer paise, never rupees. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100)
}
