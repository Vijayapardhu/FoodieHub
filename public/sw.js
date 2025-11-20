const CACHE_NAME = "foodiehub-cache-v2"
const OFFLINE_URL = "/offline"
const PRECACHE_ASSETS = [
  "/",
  OFFLINE_URL,
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME)
        // Cache each asset individually to handle failures gracefully
        await Promise.allSettled(
          PRECACHE_ASSETS.map(async (url) => {
            try {
              await cache.add(url)
            } catch (error) {
              console.log(`Failed to cache ${url}:`, error)
              // Continue with other assets even if one fails
            }
          })
        )
        self.skipWaiting()
      } catch (error) {
        console.error("Service worker install error:", error)
        // Continue with activation even if precaching fails
        self.skipWaiting()
      }
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

  // Skip API routes, auth routes, and external URLs
  if (
    requestUrl.pathname.startsWith("/api/") ||
    requestUrl.pathname.startsWith("/auth/") ||
    requestUrl.origin !== self.location.origin
  ) {
    return
  }

  event.respondWith(
    (async () => {
      try {
        // Try network first
        const networkResponse = await fetch(event.request)
        
        // Only cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          try {
            const cache = await caches.open(CACHE_NAME)
            // Use put instead of addAll to avoid failing on errors
            await cache.put(event.request, networkResponse.clone())
          } catch (cacheError) {
            // If caching fails, still return the network response
            console.log("Cache put failed:", cacheError)
          }
        }
        
        return networkResponse
      } catch (error) {
        // Network failed, try cache
        try {
          const cachedResponse = await caches.match(event.request)
          if (cachedResponse) {
            return cachedResponse
          }
        } catch (cacheError) {
          console.log("Cache match failed:", cacheError)
        }
        
        // If it's a navigation request, try offline page
        if (event.request.mode === "navigate") {
          try {
            const offlineResponse = await caches.match(OFFLINE_URL)
            if (offlineResponse) {
              return offlineResponse
            }
          } catch (offlineError) {
            console.log("Offline page not found:", offlineError)
          }
        }
        
        // Return a basic error response if everything fails
        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        })
      }
    })()
  )
})

