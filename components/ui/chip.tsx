"use client"

import * as React from "react"
import { Check } from "@/components/ui/icons"
import { cn } from "@/lib/utils/cn"

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: React.ReactNode
  /** Shows a tick when active. Use for multi-select filter sets. */
  showCheck?: boolean
  count?: number
}

/**
 * Filter pill for horizontal rails. Sized to the 44px touch minimum in height
 * so a mis-tap on a moving bus still lands on the right filter.
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    { className, active = false, icon, showCheck, count, children, ...props },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
        "transition-colors duration-150 [-webkit-tap-highlight-color:transparent] active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-brand"
          : "border-border bg-surface text-muted-foreground hover:bg-muted",
        className
      )}
      {...props}
    >
      {showCheck && active ? <Check /> : icon}
      {children}
      {typeof count === "number" ? (
        <span
          className={cn(
            "ml-0.5 rounded-full px-1.5 py-0.5 text-2xs font-bold tabular-nums",
            active ? "bg-primary-foreground/20" : "bg-muted-foreground/15"
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
)
Chip.displayName = "Chip"

/** Edge-to-edge scrolling container for a row of chips. */
export function ChipRail({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rail scroll-touch", className)} {...props}>
      {children}
    </div>
  )
}
