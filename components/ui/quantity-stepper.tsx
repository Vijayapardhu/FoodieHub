"use client"

import { Minus, Plus, Trash2 } from "@/components/ui/icons"
import { cn } from "@/lib/utils/cn"

interface QuantityStepperProps {
  quantity: number
  onIncrement: () => void
  onDecrement: () => void
  /** Swaps the minus for a bin icon at qty 1, so removal is one tap. */
  removeAtOne?: boolean
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  max?: number
  label?: string
  className?: string
}

const sizeMap = {
  sm: { wrap: "h-9", btn: "h-9 w-9", icon: "h-3.5 w-3.5", text: "w-7 text-sm" },
  md: { wrap: "h-11", btn: "h-11 w-11", icon: "h-4 w-4", text: "w-8 text-base" },
  lg: { wrap: "h-12", btn: "h-12 w-12", icon: "h-5 w-5", text: "w-10 text-lg" },
} as const

/**
 * The quantity control used everywhere an item can be added to the cart.
 * Both buttons are full-size touch targets, and the count is tabular so the
 * control doesn't jitter as digits change.
 */
export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  removeAtOne = false,
  size = "md",
  disabled = false,
  max,
  label = "item",
  className,
}: QuantityStepperProps) {
  const s = sizeMap[size]
  const atMax = typeof max === "number" && quantity >= max
  const showBin = removeAtOne && quantity === 1

  return (
    <div
      className={cn(
        "inline-flex items-center justify-between rounded-xl border border-primary/30 bg-primary-soft",
        s.wrap,
        disabled && "opacity-50",
        className
      )}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled}
        aria-label={showBin ? `Remove ${label}` : `Decrease ${label} quantity`}
        className={cn(
          "flex items-center justify-center rounded-l-xl text-primary transition-colors active:bg-primary/10 disabled:pointer-events-none",
          s.btn
        )}
      >
        {showBin ? (
          <Trash2 className={cn(s.icon, "text-destructive")} />
        ) : (
          <Minus className={s.icon} />
        )}
      </button>

      <span
        aria-live="polite"
        className={cn(
          "text-center font-bold tabular-nums text-primary",
          s.text
        )}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || atMax}
        aria-label={`Increase ${label} quantity`}
        className={cn(
          "flex items-center justify-center rounded-r-xl text-primary transition-colors active:bg-primary/10 disabled:pointer-events-none disabled:opacity-40",
          s.btn
        )}
      >
        <Plus className={s.icon} />
      </button>
    </div>
  )
}
