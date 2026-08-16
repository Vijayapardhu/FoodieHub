"use client"

import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="h-7 w-7" />
      </span>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          You&apos;re offline
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground text-balance">
          Your pickup token is saved on the server — it&apos;ll be waiting when
          you reconnect. Live order updates resume automatically.
        </p>
      </div>

      <Button size="lg" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </main>
  )
}
