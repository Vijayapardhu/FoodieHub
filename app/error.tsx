"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[route-error]", error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
        <AlertCircle className="h-7 w-7" />
      </span>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          This screen didn&apos;t load
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground text-balance">
          {error.message || "Something went wrong on our side."}
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
