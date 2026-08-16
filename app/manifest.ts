import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FoodieHub — Canteen ordering",
    short_name: "FoodieHub",
    description:
      "Order from your college canteen, skip the queue, and collect with a token.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Both match the cream canvas, so the splash screen and the Android
    // status bar are continuous with the app rather than framing it.
    background_color: "#FCF9EF",
    theme_color: "#FCF9EF",
    categories: ["food", "lifestyle", "shopping"],
    // Long-press shortcuts on the home screen icon
    shortcuts: [
      {
        name: "My orders",
        short_name: "Orders",
        description: "Track an active pickup token",
        url: "/orders",
      },
      {
        name: "Cart",
        short_name: "Cart",
        description: "Finish checking out",
        url: "/cart",
      },
      {
        name: "Saved",
        short_name: "Saved",
        description: "Your favourite dishes and canteens",
        url: "/favorites",
      },
    ],
    // Chrome's install prompt requires a real 192 and 512 PNG — an SVG-only
    // icon list silently disqualifies the app from being installable, which
    // is how this shipped before.
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  }
}
