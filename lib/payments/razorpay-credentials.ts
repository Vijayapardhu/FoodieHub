import { createAdminClient } from "@/lib/supabase/admin"

export interface RazorpayCredentials {
  keyId: string | null
  keySecret: string | null
  webhookSecret: string | null
}

/**
 * Row saved through the admin panel wins; env vars are only the fallback
 * for a deployment that hasn't used the panel yet — see migration 055.
 * `payment_credentials` has no RLS policies at all, so this only works
 * from server code with the service-role client.
 */
export async function getRazorpayCredentials(): Promise<RazorpayCredentials> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("payment_credentials")
    .select("razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret")
    .eq("id", true)
    .maybeSingle()

  return {
    keyId: data?.razorpay_key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null,
    keySecret: data?.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET || null,
    webhookSecret: data?.razorpay_webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET || null,
  }
}
