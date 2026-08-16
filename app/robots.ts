import type { MetadataRoute } from "next"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://foodiehub.vijayaapardhu.dev"

/**
 * Only the pages a signed-out visitor can actually see are worth crawling.
 *
 * Everything under the app itself is behind auth and answers a crawler with a
 * redirect to /login, so listing those paths just spends crawl budget on
 * redirects — and an indexed URL that always bounces to a sign-in form is a
 * bad search result for the person who clicks it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/credits"],
      disallow: [
        "/home",
        "/orders",
        "/cart",
        "/favorites",
        "/profile",
        "/notifications",
        "/items",
        "/canteen",
        "/admin",
        "/api",
        "/auth",
        "/complete-profile",
        "/offline",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
