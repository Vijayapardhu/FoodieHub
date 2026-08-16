"use client"

import { createClient } from "@/lib/supabase/client"

/**
 * Web push subscription management.
 *
 * `Notification.requestPermission()` on its own only buys foreground alerts —
 * the page has to be open for anything to fire. A push *subscription* is what
 * lets the server reach a device with the tab closed and the screen off,
 * which for a canteen is the entire point: an order that arrives while nobody
 * is looking at the console is exactly the one that needs to raise a noise.
 */

export type PushState =
  | "unsupported"
  | "denied"
  | "default"
  | "subscribed"
  | "permitted-not-subscribed"

/** The push service wants the VAPID key as raw bytes, not base64url. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(normalised)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ""
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

export async function getPushState(): Promise<PushState> {
  if (!pushSupported()) return "unsupported"
  if (Notification.permission === "denied") return "denied"
  if (Notification.permission === "default") return "default"

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription ? "subscribed" : "permitted-not-subscribed"
  } catch {
    return "permitted-not-subscribed"
  }
}

/**
 * Ask for permission, register with the push service, and record the endpoint
 * so the server can reach this device.
 */
export async function subscribeToPush(): Promise<{
  ok: boolean
  state: PushState
  error?: string
}> {
  if (!pushSupported()) return { ok: false, state: "unsupported" }

  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    return { ok: false, state: permission === "denied" ? "denied" : "default" }
  }

  try {
    const supabase = createClient()

    const { data: vapidPublicKey, error: keyError } =
      await supabase.rpc("vapid_public_key")
    if (keyError || !vapidPublicKey) {
      return {
        ok: false,
        state: "permitted-not-subscribed",
        error: "Push isn't configured on the server yet",
      }
    }

    const registration = await navigator.serviceWorker.ready

    // Reuse the existing subscription when there is one: re-subscribing
    // rotates the endpoint and orphans the row we already stored.
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        // Chrome refuses a subscription without this, and a silent push would
        // be a tracking vector anyway.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey as string),
      }))

    const json = subscription.toJSON() as {
      endpoint?: string
      keys?: { p256dh?: string; auth?: string }
    }

    const p256dh =
      json.keys?.p256dh ?? arrayBufferToBase64(subscription.getKey("p256dh"))
    const auth =
      json.keys?.auth ?? arrayBufferToBase64(subscription.getKey("auth"))

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, state: "permitted-not-subscribed", error: "Not signed in" }
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent.slice(0, 300),
      },
      // The same device re-subscribing must update its row, not add another.
      { onConflict: "endpoint" }
    )

    if (error) {
      return { ok: false, state: "permitted-not-subscribed", error: error.message }
    }

    return { ok: true, state: "subscribed" }
  } catch (error: any) {
    return {
      ok: false,
      state: "permitted-not-subscribed",
      error: error?.message ?? "Could not register this device",
    }
  }
}

/** Stop pushes to this device and forget the endpoint. */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!pushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return true

    const endpoint = subscription.endpoint
    await subscription.unsubscribe()

    await createClient()
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)

    return true
  } catch {
    return false
  }
}
