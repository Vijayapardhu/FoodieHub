import { Database } from "@/types/database.types"

export type PlatformSettings =
  Database["public"]["Tables"]["platform_settings"]["Row"]

/**
 * Used when the settings row hasn't been created yet (migration 019 not run) so
 * the app degrades to sensible behaviour instead of blank screens.
 */
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  id: true,
  platform_name: "FoodieHub",
  support_email: null,
  support_phone: null,
  token_length: 6,
  order_cancellation_window_minutes: 5,
  default_preparation_minutes: 20,
  max_scheduled_days_ahead: 7,
  ordering_enabled: true,
  scheduled_orders_enabled: true,
  reviews_enabled: true,
  new_canteens_require_approval: true,
  maintenance_message: null,
  promo_daily_rate: 199,
  delivery_enabled: false,
  online_payments_enabled: true,
  updated_by: null,
  updated_at: new Date(0).toISOString(),
  created_at: new Date(0).toISOString(),
}

/** Human labels for the audit log, which stores raw column names. */
export const SETTING_LABELS: Record<string, string> = {
  platform_name: "Platform name",
  support_email: "Support email",
  support_phone: "Support phone",
  token_length: "Token length",
  order_cancellation_window_minutes: "Cancellation window",
  default_preparation_minutes: "Default prep time",
  max_scheduled_days_ahead: "Scheduling horizon",
  ordering_enabled: "Ordering",
  scheduled_orders_enabled: "Scheduled orders",
  reviews_enabled: "Reviews",
  new_canteens_require_approval: "Canteen approval",
  maintenance_message: "Maintenance banner",
  promo_daily_rate: "Banner rate per day",
  delivery_enabled: "Delivery",
  online_payments_enabled: "Online payments",
  razorpay_key_id: "Razorpay Key ID",
  razorpay_key_secret: "Razorpay Key Secret",
  razorpay_webhook_secret: "Razorpay Webhook Secret",
}

export function settingLabel(key: string): string {
  return SETTING_LABELS[key] ?? key.replace(/_/g, " ")
}
