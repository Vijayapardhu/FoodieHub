import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

/**
 * Delivers a notification row to every device its owner has registered.
 *
 * Invoked by a trigger on `public.notifications`, so anything the product
 * already knows how to say — new order for a canteen, food ready for a
 * student, an order declined — arrives on a locked phone without a second
 * copy of the wording living out here.
 *
 * Authentication is a shared secret rather than a JWT: the caller is Postgres,
 * which has no user session to present.
 */

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  metadata: Record<string, unknown> | null
}

/** Where tapping the notification should land, per role. */
function targetUrl(notification: Notification, role: string): string {
  const metadata = notification.metadata ?? {}
  const token = typeof metadata.token === "string" ? metadata.token : null
  const orderId =
    typeof metadata.order_id === "string" ? metadata.order_id : null
  const handle = token ?? orderId

  if (handle) {
    if (role === "canteen_owner" || role === "admin") {
      return `/canteen/orders/${handle}`
    }
    return metadata.status === "completed"
      ? `/orders/${handle}/feedback`
      : `/orders/${handle}`
  }

  const canteenId =
    typeof metadata.canteen_id === "string" ? metadata.canteen_id : null
  if (canteenId) return `/canteen/${canteenId}`

  return role === "canteen_owner" || role === "admin" ? "/canteen/orders" : "/orders"
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data: config, error: configError } = await supabase
    .schema("private")
    .from("push_config")
    .select("*")
    .eq("id", true)
    .maybeSingle()

  if (configError || !config) {
    return new Response(JSON.stringify({ error: "push not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (req.headers.get("x-push-secret") !== config.webhook_secret) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  let notificationId: string | undefined
  try {
    notificationId = (await req.json()).notification_id
  } catch {
    // fall through to the 400 below
  }

  if (!notificationId) {
    return new Response(JSON.stringify({ error: "notification_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { data: notification } = await supabase
    .from("notifications")
    .select("id, user_id, title, message, type, metadata")
    .eq("id", notificationId)
    .maybeSingle<Notification>()

  if (!notification) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", notification.user_id)

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no devices" }), {
      headers: { "Content-Type": "application/json" },
    })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", notification.user_id)
    .maybeSingle()

  webpush.setVapidDetails(
    config.vapid_subject,
    config.vapid_public,
    config.vapid_private
  )

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    // One tag per order, so three status changes replace each other on the
    // lock screen instead of stacking into a pile of stale alerts.
    tag: (notification.metadata?.order_id as string) ?? notification.id,
    url: targetUrl(notification, profile?.role ?? "user"),
  })

  let sent = 0
  const expired: string[] = []

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: 600, urgency: "high" }
        )
        sent++
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        // 404/410 mean the browser threw the subscription away — uninstalled,
        // permission revoked, or profile wiped. Keeping it would mean retrying
        // a dead endpoint on every future order.
        if (status === 404 || status === 410) {
          expired.push(subscription.id)
        } else {
          console.error("push failed", status, (error as Error).message)
        }
      }
    })
  )

  if (expired.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expired)
  }

  if (sent > 0) {
    await supabase
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", notification.user_id)
  }

  return new Response(JSON.stringify({ sent, pruned: expired.length }), {
    headers: { "Content-Type": "application/json" },
  })
})
