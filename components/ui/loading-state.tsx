"use client"

import { cn } from "@/lib/utils/cn"

export function Skeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-orange-100 via-orange-50 to-orange-100",
        className
      )}
    />
  )
}

export function LoadingState({
  rows = 3,
}: {
  rows?: number
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, idx) => (
        <Skeleton key={idx} className="h-16" />
      ))}
    </div>
  )
}

