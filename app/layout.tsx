import type { Metadata, Viewport } from "next"
import { Manrope, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"
import { ErrorBoundary } from "@/components/error-boundary"
import { themeInitScript } from "@/components/theme-provider"

// Headings: geometric and quiet. Enough character to not be system-default,
// restrained enough to read as a company rather than a campaign.
const display = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
})

// Body face stays quiet so the display type can shout.
const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
})

/**
 * The canonical origin. Without it every `openGraph.images` path stays
 * relative, and a crawler resolving a relative image against nothing gets no
 * preview at all — which is most of what link metadata is for.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://foodiehub-dusky.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FoodieHub — canteen ordering at Aditya University, Surampalem",
    template: "%s · FoodieHub",
  },
  description:
    "Order ahead from the canteens at Aditya University, Surampalem. Skip the queue, collect with a pickup token, and pay at the counter — same price, no delivery fee.",
  // Written for how a student would actually search: the campus name, the
  // town, and the problem ("canteen queue"), not marketing abstractions.
  keywords: [
    "Aditya University canteen",
    "Aditya University food ordering",
    "Surampalem canteen",
    "Surampalem food delivery app",
    "campus food ordering",
    "college canteen app",
    "skip canteen queue",
    "Aditya Engineering College canteen",
    "FoodieHub",
  ],
  authors: [{ name: "Vijaya Pardhu", url: "https://vijayaapardhu.dev" }],
  creator: "Vijaya Pardhu",
  publisher: "FoodieHub",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "FoodieHub",
    locale: "en_IN",
    url: SITE_URL,
  },
  manifest: "/manifest.webmanifest",
  applicationName: "FoodieHub",
  appleWebApp: {
    capable: true,
    title: "FoodieHub",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  // Next emits the legacy `apple-mobile-web-app-capable` from `appleWebApp`
  // above; Chrome warns that it's deprecated in favour of this one. Both are
  // needed: iOS still reads the Apple-prefixed tag.
  other: { "mobile-web-app-capable": "yes" },
  icons: {
    // .ico first for the browsers that only look for one, then the SVG for
    // everything modern (it stays crisp on any display and in dark tab bars).
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icons/icon-compact.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/icons/icon-mono.svg", color: "#2E7D5B" }],
  },
}

export const viewport: Viewport = {
  // One unconditional tag, deliberately: theme-provider owns its value (the
  // init script sets it pre-paint, the toggle updates it live). Media-scoped
  // variants would emit two tags and querySelector would only ever find one.
  themeColor: "#FCF9EF",
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays available for accessibility; only auto-zoom is prevented,
  // which the 16px input rule in globals.css already handles.
  maximumScale: 5,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${display.variable} ${body.variable} font-sans min-h-screen bg-background`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
