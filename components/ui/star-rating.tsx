"use client"

import { Star } from "@/components/ui/icons"
import { cn } from "@/lib/utils/cn"

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-8 w-8",
} as const

/**
 * The tap target, which is not the same thing as the star. A picker rating one
 * dish in a list of dishes has to fit beside a thumbnail and a name, and five
 * 48px targets do not — but they must stay comfortably tappable.
 */
const targets = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const

/** Read-only star row. */
export function StarRating({
  value,
  size = "sm",
  className,
}: {
  value: number
  size?: keyof typeof sizes
  className?: string
}) {
  const rounded = Math.round(value)
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${value.toFixed(1)} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star
          key={idx}
          aria-hidden="true"
          className={cn(
            sizes[size],
            idx < rounded
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-border"
          )}
        />
      ))}
    </span>
  )
}

/** Interactive star picker for review forms. Large targets for thumbs. */
export function StarPicker({
  value,
  onChange,
  size = "lg",
  className,
}: {
  value: number
  onChange: (value: number) => void
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className={cn("flex items-center gap-1", className)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => onChange(star)}
          className={cn(
            "flex items-center justify-center rounded-xl transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            targets[size]
          )}
        >
          <Star
            className={cn(
              sizes[size],
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-border"
            )}
          />
        </button>
      ))}
    </div>
  )
}
