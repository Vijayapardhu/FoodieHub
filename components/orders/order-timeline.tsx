import { Check, XCircle } from "lucide-react"
import {
  ORDER_FLOW,
  ORDER_STATUS_META,
  type OrderStatus,
} from "@/lib/utils/order-status"
import { cn } from "@/lib/utils/cn"

/**
 * Vertical progress rail for an order. Vertical rather than horizontal because
 * five labelled steps don't fit legibly across a phone.
 */
export function OrderTimeline({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  if (status === "cancelled") {
    const meta = ORDER_STATUS_META.cancelled
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive-soft p-4",
          className
        )}
      >
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-destructive">{meta.label}</p>
          <p className="text-sm text-destructive/80">{meta.customerHint}</p>
        </div>
      </div>
    )
  }

  const currentStep = ORDER_STATUS_META[status]?.step ?? 0

  return (
    <ol className={cn("relative space-y-0", className)}>
      {ORDER_FLOW.map((step, index) => {
        const meta = ORDER_STATUS_META[step]
        const Icon = meta.icon
        const done = index < currentStep
        const current = index === currentStep
        const reached = done || current
        const last = index === ORDER_FLOW.length - 1

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-success bg-success text-success-foreground",
                  current &&
                    "border-primary bg-primary text-primary-foreground",
                  !reached && "border-border bg-surface text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {current ? (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />
                ) : null}
              </span>

              {!last ? (
                <span
                  className={cn(
                    "w-0.5 flex-1 transition-colors",
                    done ? "bg-success" : "bg-border"
                  )}
                />
              ) : null}
            </div>

            <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-6")}>
              <p
                className={cn(
                  "text-sm font-semibold",
                  current
                    ? "text-primary"
                    : reached
                      ? "text-foreground"
                      : "text-muted-foreground"
                )}
              >
                {meta.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {meta.customerHint}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Compact horizontal bar for list cards where the full rail is too tall. */
export function OrderProgressBar({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  if (status === "cancelled") {
    return (
      <div
        className={cn("h-1.5 w-full rounded-full bg-destructive/25", className)}
      />
    )
  }

  const step = ORDER_STATUS_META[status]?.step ?? 0
  const percent = ((step + 1) / ORDER_FLOW.length) * 100

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Order ${ORDER_STATUS_META[status]?.label ?? status}`}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          status === "completed" ? "bg-success" : "bg-primary"
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
