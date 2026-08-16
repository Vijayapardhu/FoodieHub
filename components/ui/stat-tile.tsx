import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface StatTileProps {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  /** Percentage change vs. the previous period. Positive renders as a rise. */
  delta?: number
  tone?: "default" | "primary" | "success" | "warning" | "destructive" | "info"
  className?: string
}

const toneMap = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  destructive: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
} as const

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  tone = "default",
  className,
}: StatTileProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta)
  const rising = hasDelta && delta! >= 0

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-3.5 shadow-card sm:p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              toneMap[tone]
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </p>

      <div className="mt-1 flex items-center gap-1.5">
        {hasDelta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
              rising ? "text-success" : "text-destructive"
            )}
          >
            {rising ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(delta!).toFixed(0)}%
          </span>
        ) : null}
        {hint ? (
          <span className="truncate text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
    </div>
  )
}

/** Responsive grid for a row of stat tiles: 2-up on phones, 4-up on desktop. */
export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  )
}
