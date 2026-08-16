import {
  CheckCircle2,
  UserX,
  ChefHat,
  CircleDashed,
  PackageCheck,
  ShoppingBag,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { Database } from "@/types/database.types"

export type OrderStatus = Database["public"]["Enums"]["order_status"]

export interface OrderStatusMeta {
  label: string
  /** Shown to the customer on the tracking timeline. */
  customerHint: string
  icon: LucideIcon
  /** Badge variant from components/ui/badge. */
  badge: "muted" | "info" | "warning" | "success" | "destructive" | "soft"
  /** Position in the happy path; -1 for terminal non-success states. */
  step: number
}

/** The forward-only sequence an order moves through when nothing goes wrong. */
export const ORDER_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
]

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending: {
    label: "Placed",
    customerHint: "Waiting for the canteen to accept your order",
    icon: CircleDashed,
    badge: "muted",
    step: 0,
  },
  confirmed: {
    label: "Confirmed",
    customerHint: "The canteen accepted your order",
    icon: ShoppingBag,
    badge: "info",
    step: 1,
  },
  preparing: {
    label: "Preparing",
    customerHint: "Your food is being cooked",
    icon: ChefHat,
    badge: "warning",
    step: 2,
  },
  ready: {
    label: "Ready",
    customerHint: "Show your token at the counter to collect",
    icon: PackageCheck,
    badge: "success",
    step: 3,
  },
  completed: {
    label: "Completed",
    customerHint: "Collected — enjoy your meal",
    icon: CheckCircle2,
    badge: "success",
    step: 4,
  },
  no_show: {
    label: "Not collected",
    customerHint: "This order was never picked up",
    icon: UserX,
    badge: "warning",
    step: -1,
  },
  cancelled: {
    label: "Cancelled",
    customerHint: "This order was cancelled",
    icon: XCircle,
    badge: "destructive",
    step: -1,
  },
}

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
]

export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_ORDER_STATUSES.includes(status)
}

/** The status an owner would move this order to next, if any. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const idx = ORDER_FLOW.indexOf(status)
  if (idx < 0 || idx >= ORDER_FLOW.length - 1) return null
  return ORDER_FLOW[idx + 1]
}

/**
 * A customer may only pull an order back while the kitchen hasn't started on
 * it. Once it is `preparing`, food has been committed.
 */
export function isCustomerCancellable(status: OrderStatus): boolean {
  return status === "pending" || status === "confirmed"
}

export function statusMeta(status: string): OrderStatusMeta {
  return ORDER_STATUS_META[status as OrderStatus] ?? ORDER_STATUS_META.pending
}
