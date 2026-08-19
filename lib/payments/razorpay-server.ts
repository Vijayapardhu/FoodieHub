import Razorpay from "razorpay"
import { getRazorpayCredentials } from "./razorpay-credentials"

/**
 * Server-only. Throws rather than silently no-op'ing if keys are missing.
 * Built fresh on every call rather than cached — an admin can rotate the
 * key pair at any time from the admin panel, and a cached instance would
 * keep signing requests with the old secret until the process restarted.
 */
export async function getRazorpay(): Promise<{ razorpay: Razorpay; keyId: string }> {
  const { keyId, keySecret } = await getRazorpayCredentials()

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured (missing key id or key secret)")
  }

  return { razorpay: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId }
}

/** Razorpay takes amounts as integer paise, never rupees. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100)
}
