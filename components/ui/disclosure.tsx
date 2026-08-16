"use client"

import * as React from "react"
import { ChevronDown, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface DisclosureProps {
  title: string
  /** Right-aligned summary shown while collapsed, e.g. "₹20 off applied". */
  summary?: React.ReactNode
  icon?: LucideIcon
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

/**
 * Collapsible section built on <details>, so it works before hydration and
 * keeps long checkout options from turning the cart into an endless scroll.
 */
export function Disclosure({
  title,
  summary,
  icon: Icon,
  defaultOpen = false,
  children,
  className,
}: DisclosureProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group overflow-hidden rounded-2xl border border-border bg-card",
        className
      )}
    >
      <summary className="flex min-h-touch cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            {title}
          </span>
          {summary ? (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {summary}
            </span>
          ) : null}
        </span>

        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="border-t border-border p-4">{children}</div>
    </details>
  )
}
