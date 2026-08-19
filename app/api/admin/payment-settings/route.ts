import { z } from "zod"
import Razorpay from "razorpay"
import {
  createSecureHandler,
  successResponse,
  errorResponse,
} from "@/lib/api/middleware"
import { createAdminClient } from "@/lib/supabase/admin"

/** Never send a saved secret back to the browser — just enough to confirm
 * it's set and let an admin recognise which one it is. */
function preview(secret: string | null | undefined): string | null {
  if (!secret) return null
  return secret.length <= 4 ? "••••" : `••••${secret.slice(-4)}`
}

// GET — the admin panel's payments card: the on/off switch plus enough
// about the saved Razorpay credentials to render without ever exposing the
// secret values themselves.
export const GET = createSecureHandler({
  allowedRoles: ["admin"],
  handler: async () => {
    const admin = createAdminClient()
    const [{ data: settings }, { data: creds }] = await Promise.all([
      admin
        .from("platform_settings")
        .select("online_payments_enabled")
        .eq("id", true)
        .maybeSingle(),
      admin
        .from("payment_credentials")
        .select("razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret")
        .eq("id", true)
        .maybeSingle(),
    ])

    const keyId = creds?.razorpay_key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null
    const keySecret = creds?.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET || null
    const webhookSecret =
      creds?.razorpay_webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET || null

    return successResponse({
      online_payments_enabled: settings?.online_payments_enabled ?? true,
      razorpay_key_id: keyId,
      razorpay_key_secret_set: Boolean(keySecret),
      razorpay_key_secret_preview: preview(keySecret),
      razorpay_webhook_secret_set: Boolean(webhookSecret),
      razorpay_webhook_secret_preview: preview(webhookSecret),
    })
  },
})

const patchSchema = z.object({
  online_payments_enabled: z.boolean().optional(),
  // Blank/omitted on any of these three means "leave it as it is" — a
  // secret rotation form has no other sane way to let an admin change just
  // one field without re-pasting the other two every time.
  razorpay_key_id: z.string().max(200).optional(),
  razorpay_key_secret: z.string().max(200).optional(),
  razorpay_webhook_secret: z.string().max(200).optional(),
})

// PATCH — admin-only. Credential changes are verified against Razorpay's
// own API before anything is persisted (a plain `orders.all` list call,
// same as the manual curl check used to debug the original "Razorpay is
// broken" report) so a typo'd key never gets saved silently.
export const PATCH = createSecureHandler({
  allowedRoles: ["admin"],
  schema: patchSchema,
  handler: async (request, { user, supabase, body }) => {
    const admin = createAdminClient()

    const trimmedKeyId = body.razorpay_key_id?.trim()
    const trimmedKeySecret = body.razorpay_key_secret?.trim()
    const trimmedWebhookSecret = body.razorpay_webhook_secret?.trim()

    const credentialsUpdate: Record<string, unknown> = {}
    if (trimmedKeyId) credentialsUpdate.razorpay_key_id = trimmedKeyId
    if (trimmedKeySecret) credentialsUpdate.razorpay_key_secret = trimmedKeySecret
    if (trimmedWebhookSecret) credentialsUpdate.razorpay_webhook_secret = trimmedWebhookSecret

    if (trimmedKeyId || trimmedKeySecret) {
      const { data: existing } = await admin
        .from("payment_credentials")
        .select("razorpay_key_id, razorpay_key_secret")
        .eq("id", true)
        .maybeSingle()

      const nextKeyId =
        trimmedKeyId || existing?.razorpay_key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      const nextKeySecret =
        trimmedKeySecret || existing?.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET

      if (!nextKeyId || !nextKeySecret) {
        return errorResponse("Both a Key ID and Key Secret are needed", 400)
      }

      try {
        await new Razorpay({ key_id: nextKeyId, key_secret: nextKeySecret }).orders.all({
          count: 1,
        })
      } catch (err: any) {
        return errorResponse(
          err?.error?.description ||
            "Razorpay rejected these credentials — double check the Key ID and Secret",
          400
        )
      }
    }

    if (Object.keys(credentialsUpdate).length > 0) {
      credentialsUpdate.updated_by = user.id
      const { error } = await admin
        .from("payment_credentials")
        .update(credentialsUpdate)
        .eq("id", true)

      if (error) {
        return errorResponse("Could not save the Razorpay credentials", 500)
      }

      // Logged without values — settings_audit_log is admin-readable, and a
      // secret has no business sitting in a change history even for admins.
      await admin.from("settings_audit_log").insert({
        changed_by: user.id,
        changes: Object.fromEntries(
          Object.keys(credentialsUpdate)
            .filter((key) => key !== "updated_by")
            .map((key) => [key, { from: "••••", to: "••••" }])
        ),
      })
    }

    if (body.online_payments_enabled !== undefined) {
      const { error } = await supabase
        .from("platform_settings")
        .update({ online_payments_enabled: body.online_payments_enabled, updated_by: user.id })
        .eq("id", true)

      if (error) {
        return errorResponse("Could not save the payments toggle", 500)
      }
    }

    return successResponse({ saved: true })
  },
})
