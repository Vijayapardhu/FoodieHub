import { Badge } from "@/components/ui/badge"
import { statusMeta, type OrderStatus } from "@/lib/utils/order-status"
import { cn } from "@/lib/utils/cn"

export function StatusBadge({
  status,
  showIcon = true,
  size = "default",
  className,
}: {
  status: OrderStatus | string
  showIcon?: boolean
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  const meta = statusMeta(status)
  const Icon = meta.icon

  return (
    <Badge variant={meta.badge} size={size} className={cn("shrink-0", className)}>
      {showIcon ? <Icon aria-hidden="true" /> : null}
      {meta.label}
    </Badge>
  )
}

/** Green/red dot used on menu items. Mirrors the FSSAI veg mark convention. */
export function VegMark({
  vegetarian,
  withLabel = false,
  className,
}: {
  vegetarian: boolean
  withLabel?: boolean
  className?: string
}) {
  const label = vegetarian ? "Vegetarian" : "Non-vegetarian"

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        role="img"
        aria-label={label}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-surface",
          vegetarian ? "border-veg" : "border-nonveg"
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            vegetarian ? "bg-veg" : "bg-nonveg"
          )}
        />
      </span>
      {withLabel ? (
        <span
          className={cn(
            "text-xs font-semibold",
            vegetarian ? "text-veg" : "text-nonveg"
          )}
        >
          {vegetarian ? "Veg" : "Non-veg"}
        </span>
      ) : null}
    </span>
  )
}
