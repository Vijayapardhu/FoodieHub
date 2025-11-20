const CACHE_NAME = "foodiehub-cache-v1"
const OFFLINE_URL = "/offline"
const PRECACHE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon.svg",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(PRECACHE_ASSETS)
      self.skipWaiting()
    })()
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
      self.clients.claim()
    })()
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return
  }

  const requestUrl = new URL(event.request.url)

  // Skip API routes
  if (requestUrl.pathname.startsWith("/api/")) {
    return
  }

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request)
        const cache = await caches.open(CACHE_NAME)
        cache.put(event.request, networkResponse.clone())
        return networkResponse
      } catch (error) {
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) {
          return cachedResponse
        }
        if (event.request.mode === "navigate") {
          const offlineResponse = await caches.match(OFFLINE_URL)
          if (offlineResponse) {
            return offlineResponse
          }
        }
        throw error
      }
    })()
  )
})

