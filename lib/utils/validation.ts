import { z } from "zod"

/**
 * Common validation schemas
 */

export const emailSchema = z.string().email("Invalid email address")

export const phoneSchema = z
  .string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number")

export const priceSchema = z
  .number()
  .min(0, "Price must be positive")
  .max(100000, "Price is too high")

export const quantitySchema = z
  .number()
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(100, "Quantity cannot exceed 100")

export const tokenSchema = z
  .string()
  .length(6, "Token must be 6 characters")
  .regex(/^[A-Z0-9]+$/, "Token must contain only uppercase letters and numbers")

export const ratingSchema = z
  .number()
  .int()
  .min(1, "Rating must be at least 1")
  .max(5, "Rating cannot exceed 5")

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
])

export const userRoleSchema = z.enum(["user", "canteen_owner", "admin"])

