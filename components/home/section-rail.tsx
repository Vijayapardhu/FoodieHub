"use client"

import { ArrowRight } from "@/components/ui/icons"
import { cn } from "@/lib/utils/cn"

/**
 * A titled horizontal rail.
 *
 * Rails rather than a grid, deliberately. A grid of identical cards reads as
 * a catalogue to be worked through; a rail reads as a shelf to be browsed,
 * and lets one screen carry six different ideas — picks, cravings, canteens,
 * budget, quick bites — instead of one long undifferentiated list.
 *
 * The rail bleeds to the screen edge and keeps the next card half-visible, so
 * there is no doubt it scrolls.
 */
export function SectionRail({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold leading-tight tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>

        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary"
          >
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="rail">{children}</div>
    </section>
  )
}
