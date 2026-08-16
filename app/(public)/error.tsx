"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, Home, RefreshCw, WifiOff } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"

/**
 * Segment-level boundary for the customer app. The global one at app/error.tsx
 * replaces the entire page including the nav; this keeps the failure scoped to
 * the screen that broke, and offers the two things that actually help — retry,
 * or go somewhere that works.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[public-route-error]", error)
  }, [error])

  // A dropped connection is by far the most common cause on a phone moving
  // between campus wifi and mobile data, and it needs different wording.
  const offline =
    typeof navigator !== "undefined" && navigator.onLine === false

  return (
    <main className="app-container flex min-h-[70dvh] flex-col items-center justify-center gap-5 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
        {offline ? (
          <WifiOff className="h-7 w-7" />
        ) : (
          <AlertCircle className="h-7 w-7" />
        )}
      </span>

      <div className="space-y-2">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">
          {offline ? "You're offline" : "This screen didn't load"}
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground text-balance">
          {offline
            ? "Reconnect and try again — your cart and saved token are still here."
            : error.message || "Something went wrong while loading this page."}
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button size="lg" block onClick={reset}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button size="lg" variant="outline" block asChild>
          <Link href="/home">
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </main>
  )
}
