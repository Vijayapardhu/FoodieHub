import {
  CheckCircle2,
  UserX,
  ChefHat,
  CircleDashed,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
  type IconComponent,
} from "@/components/ui/icons"
import { Database } from "@/types/database.types"

export type OrderStatus = Database["public"]["Enums"]["order_status"]
export type FulfillmentType =
  Database["public"]["Tables"]["orders"]["Row"]["fulfillment_type"]

export interface OrderStatusMeta {
  label: string
  /** Shown to the customer on the tracking timeline. */
  customerHint: string
  icon: IconComponent
  /** Badge variant from components/ui/badge. */
  badge: "muted" | "info" | "warning" | "success" | "destructive" | "soft"
  /** Position in the happy path; -1 for terminal non-success states. */
  step: number
}

/**
 * Two forward-only sequences, not one — a delivery order has no counter to
 * show a token at, so "ready" (step 3) is "out for delivery" instead. They
 * never appear in the same order's flow, which is why both can safely share
 * step 3 in ORDER_STATUS_META below.
 */
export const PICKUP_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
]

export const DELIVERY_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
]

export function orderFlow(fulfillmentType: FulfillmentType = "pickup"): OrderStatus[] {
  return fulfillmentType === "delivery" ? DELIVERY_FLOW : PICKUP_FLOW
}

/** @deprecated Use `orderFlow(fulfillmentType)` — kept as the pickup default
 *  for call sites that don't yet carry a fulfillment type. */
export const ORDER_FLOW = PICKUP_FLOW

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
  out_for_delivery: {
    label: "Out for delivery",
    customerHint: "On its way to your block",
    icon: Truck,
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
  "out_for_delivery",
]

export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_ORDER_STATUSES.includes(status)
}

/** The status an owner would move this order to next, if any. */
export function nextStatus(
  status: OrderStatus,
  fulfillmentType: FulfillmentType = "pickup"
): OrderStatus | null {
  const flow = orderFlow(fulfillmentType)
  const idx = flow.indexOf(status)
  if (idx < 0 || idx >= flow.length - 1) return null
  return flow[idx + 1]
}

/** What the "advance this order" button should say, per fulfilment type. */
const ADVANCE_LABEL: Record<
  NonNullable<FulfillmentType>,
  Partial<Record<OrderStatus, string>>
> = {
  pickup: {
    pending: "Accept order",
    confirmed: "Start cooking",
    preparing: "Mark ready",
    ready: "Hand over & complete",
  },
  delivery: {
    pending: "Accept order",
    confirmed: "Start cooking",
    preparing: "Out for delivery",
    out_for_delivery: "Mark delivered",
  },
}

export function nextActionLabel(
  status: OrderStatus,
  fulfillmentType: FulfillmentType = "pickup"
): string | undefined {
  return ADVANCE_LABEL[fulfillmentType ?? "pickup"]?.[status]
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
