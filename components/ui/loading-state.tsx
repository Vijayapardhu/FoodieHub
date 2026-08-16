"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Skeleton } from "@/components/ui/skeleton"

export { Skeleton }

export function Spinner({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <Loader2 className={cn("h-5 w-5 animate-spin text-primary", className)} />
      {label ? (
        <span className="text-sm text-muted-foreground">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </span>
  )
}

export function LoadingState({
  rows = 3,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, idx) => (
        <Skeleton key={idx} className="h-20 rounded-2xl" />
      ))}
    </div>
  )
}

/** Full-height centred spinner for route-level loading. */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}…</p>
    </div>
  )
}

/** Matches the shape of a menu/canteen card grid while data loads. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="space-y-2">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

/** Matches the shape of a stacked list of rows (orders, reviews, users). */
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
