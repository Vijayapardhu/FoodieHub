/**
 * Application constants
 */

export const APP_NAME = "FoodieHub"
export const APP_DESCRIPTION = "Order food from your college canteen with ease"

// Order statuses
export const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

// User roles
export const USER_ROLES = {
  USER: "user",
  CANTEEN_OWNER: "canteen_owner",
  ADMIN: "admin",
} as const

// Payment methods
export const PAYMENT_METHODS = {
  ON_SHOP: "on_shop",
  ONLINE: "online",
} as const

// Notification types
export const NOTIFICATION_TYPES = {
  ORDER: "order",
  PROMOTION: "promotion",
  SYSTEM: "system",
  FEEDBACK: "feedback",
} as const

// Limits
export const MAX_CART_ITEMS = 50
export const MAX_QUANTITY_PER_ITEM = 100
export const MAX_REVIEW_PHOTOS = 5
export const MAX_GALLERY_IMAGES = 4

// Timeouts
export const ORDER_TIMEOUT_MINUTES = 30
export const CANCELLATION_WINDOW_MINUTES = 5

// Loyalty points
export const POINTS_PER_RUPEE = 0.1 // 1 point per ₹10
export const LOYALTY_TIERS = {
  BRONZE: { name: "Bronze", multiplier: 1, minPoints: 0 },
  SILVER: { name: "Silver", multiplier: 1.2, minPoints: 100 },
  GOLD: { name: "Gold", multiplier: 1.5, minPoints: 500 },
  PLATINUM: { name: "Platinum", multiplier: 2, minPoints: 1000 },
} as const

// Image upload
export const MAX_IMAGE_SIZE_MB = 5
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

// Pagination
export const ITEMS_PER_PAGE = 20
export const ORDERS_PER_PAGE = 10

