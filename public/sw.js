// FoodieHub service worker.
//
// Caching rules, in order of how much they matter:
//   1. Never cache anything authenticated or non-GET — a shared device must not
//      serve one student's order page to the next.
//   2. Navigations go to the network first, falling back to /offline so a dead
//      connection shows a real page instead of the browser's error screen.
//   3. Immutable build assets are cache-first; they're content-hashed, so a
//      stale hit is impossible.
//
// Rule 3 only holds in production. Dev builds reuse /_next/static filenames
// across rebuilds, so caching them pins stale JS — including the NEXT_PUBLIC_*
// values inlined at compile time.
//
// The worker used to unregister itself on localhost to escape that. It does
// not any more: the stale-bundle problem came from the *fetch handler*, not
// from the worker existing, and a worker that deletes itself also deletes the
// only thing that can receive a push message — so notifications could never
// be tested outside production. On localhost it now installs with no fetch
// handler and no caches, which intercepts nothing while still handling push.

const VERSION = "v3"
const PRECACHE = `foodiehub-precache-${VERSION}`
const RUNTIME = `foodiehub-runtime-${VERSION}`
const OFFLINE_URL = "/offline"

const IS_LOCALHOST = ["localhost", "127.0.0.1", "::1", ""].includes(
  self.location.hostname
)

if (IS_LOCALHOST) {
  // --- Development: push only, no caching ---------------------------------
  self.addEventListener("install", () => self.skipWaiting())

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        // Bin anything a previous, caching worker left behind.
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
        await self.clients.claim()
      })()
    )
  })

  // No fetch handler: every request goes straight to the dev server, so a
  // rebuilt bundle is always the one that gets served.
} else {
  // --- Production ----------------------------------------------------------

  // Kept deliberately small: only routes that render identically for everyone.
  const PRECACHE_URLS = [
    OFFLINE_URL,
    "/manifest.webmanifest",
    "/icons/icon-compact.svg",
    "/icons/icon-192.png",
  ]

  self.addEventListener("install", (event) => {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(PRECACHE)
        // Added one at a time: addAll rejects the whole install if a single
        // request 404s, which would leave the app with no offline page at all.
        await Promise.all(
          PRECACHE_URLS.map(async (url) => {
            try {
              await cache.add(new Request(url, { cache: "reload" }))
            } catch (error) {
              console.warn("[sw] could not precache", url, error)
            }
          })
        )
        await self.skipWaiting()
      })()
    )
  })

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        const names = await caches.keys()
        await Promise.all(
          names
            .filter((name) => name !== PRECACHE && name !== RUNTIME)
            .map((name) => caches.delete(name))
        )
        await self.clients.claim()
      })()
    )
  })

  /** Content-hashed build output and static icons are safe to cache forever. */
  const isImmutableAsset = (url) =>
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")

  /** Anything that reads or writes user data must always hit the network. */
  const isPrivate = (url) =>
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_next/image")

  self.addEventListener("fetch", (event) => {
    const { request } = event
    if (request.method !== "GET") return

    const url = new URL(request.url)
    if (url.origin !== self.location.origin) return
    if (isPrivate(url)) return

    if (request.mode === "navigate") {
      event.respondWith(
        (async () => {
          try {
            return await fetch(request)
          } catch {
            const cache = await caches.open(PRECACHE)
            return (
              (await cache.match(OFFLINE_URL)) ??
              new Response("You are offline.", {
                status: 503,
                headers: { "Content-Type": "text/plain" },
              })
            )
          }
        })()
      )
      return
    }

    if (isImmutableAsset(url)) {
      event.respondWith(
        (async () => {
          const cached = await caches.match(request)
          if (cached) return cached

          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(RUNTIME)
            cache.put(request, response.clone())
          }
          return response
        })()
      )
    }
  })
}

// --- Push notifications (both environments) ---------------------------------

self.addEventListener("push", (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: "FoodieHub", body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "FoodieHub", {
      body: payload.body || payload.message || "",
      // PNG, not SVG: Chrome on Android drops SVG notification art silently
      // and falls back to the generic bell.
      icon: "/icons/notification-192.png",
      badge: "/icons/badge-96.png",
      tag: payload.tag || "foodiehub",
      data: { url: payload.url || "/orders" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = event.notification.data?.url || "/orders"

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      })

      // Reuse an open tab rather than stacking new ones on every tap.
      for (const client of clientList) {
        if (client.url.includes(target) && "focus" in client) {
          return client.focus()
        }
      }
      if (clientList.length > 0 && "navigate" in clientList[0]) {
        await clientList[0].focus()
        return clientList[0].navigate(target)
      }
      return self.clients.openWindow(target)
    })()
  )
})
