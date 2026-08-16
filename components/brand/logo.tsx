import { cn } from "@/lib/utils/cn"

/**
 * The bowl mark, tightly cropped.
 *
 * This is the compact variant of the app icon — same geometry, no steam. The
 * steam curls in the launcher icon stop resolving below roughly 48px, and in
 * the UI this renders at 28–64px, so the bowl carries the mark on its own.
 * Filled with currentColor so it inherits whatever it is placed on.
 */
export function BowlGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="70 172 372 174"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <rect x="76" y="178" width="360" height="42" rx="21" />
      <path d="M108 220a148 118 0 0 0 296 0z" />
    </svg>
  )
}

/** The mark in its green tile — the app-icon lockup, for use in chrome. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-brand",
        className
      )}
    >
      <BowlGlyph className="w-[64%]" />
    </span>
  )
}

interface LogoProps {
  /** Tailwind sizing for the tile, e.g. "h-8 w-8". */
  markClassName?: string
  /** Tailwind sizing for the wordmark. */
  wordClassName?: string
  /** Hide the wordmark below a breakpoint, for tight app bars. */
  wordHiddenClassName?: string
  className?: string
}

/**
 * Mark plus wordmark. "Hub" takes the brand colour in every placement so the
 * lockup is recognisable even where the tile is too small to read.
 */
export function Logo({
  markClassName = "h-8 w-8",
  wordClassName = "text-base",
  wordHiddenClassName,
  className,
}: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          "font-display font-extrabold tracking-tight text-foreground",
          wordClassName,
          wordHiddenClassName
        )}
      >
        Foodie<span className="text-primary">Hub</span>
      </span>
    </span>
  )
}
