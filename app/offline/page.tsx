"use client"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-4xl font-bold text-primary">You are offline</h1>
        <p className="text-muted-foreground">
          It looks like you lost your internet connection. Don&apos;t worry, you
          can continue browsing once you&apos;re back online.
        </p>
        <p className="text-sm text-muted-foreground">
          Active orders and real-time updates will resume when you reconnect.
        </p>
        <button
          className="w-full rounded-full bg-primary px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-primary/90"
          onClick={() => window.location.reload()}
        >
          Retry Connection
        </button>
      </div>
    </div>
  )
}

