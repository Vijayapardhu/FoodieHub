import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FoodieHub - Canteen Management System",
  description: "Order food from your college canteen with ease",
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", url: "/icons/icon.svg" },
    { rel: "apple-touch-icon", url: "/icons/icon.svg" },
  ],
}

export const viewport: Viewport = {
  themeColor: "#FF6B35",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
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

