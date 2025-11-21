import { NextRequest } from "next/server"
import { z } from "zod"
import {
  createSecureHandler,
  successResponse,
  errorResponse,
  isValidUUID,
} from "@/lib/api/middleware"

const validateScheduledOrderSchema = z.object({
  canteen_id: z.string().uuid("Invalid canteen ID"),
  scheduled_pickup_time: z.string().datetime("Invalid datetime format"),
})

// POST - Validate scheduled order time
export const POST = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  schema: validateScheduledOrderSchema,
  handler: async (request, { user, supabase, body }) => {
    // Parse scheduled time
    const scheduledTime = new Date(body.scheduled_pickup_time)
    const now = new Date()

    // Validate it's in the future
    if (scheduledTime <= now) {
      return errorResponse("Scheduled time must be in the future", 400)
    }

    // Validate it's not too far in the future (max 30 days)
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    if (scheduledTime > maxDate) {
      return errorResponse("Scheduled time cannot be more than 30 days in the future", 400)
    }

    // Check canteen exists and get operating hours
    const { data: canteen, error: canteenError } = await supabase
      .from("canteens")
      .select("id, operating_hours, is_open")
      .eq("id", body.canteen_id)
      .single()

    if (canteenError || !canteen) {
      return errorResponse("Canteen not found", 404)
    }

    // Validate scheduled time is within operating hours (if available)
    if (canteen.operating_hours && typeof canteen.operating_hours === "object") {
      const dayOfWeek = scheduledTime.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      const hours = (canteen.operating_hours as any)[dayOfWeek]

      if (hours) {
        const { open, close } = hours
        const scheduledHour = scheduledTime.getHours()
        const scheduledMinute = scheduledTime.getMinutes()
        const scheduledMinutes = scheduledHour * 60 + scheduledMinute

        if (open && close) {
          const [openHour, openMinute] = open.split(":").map(Number)
          const [closeHour, closeMinute] = close.split(":").map(Number)
          const openMinutes = openHour * 60 + openMinute
          const closeMinutes = closeHour * 60 + closeMinute

          if (scheduledMinutes < openMinutes || scheduledMinutes > closeMinutes) {
            return errorResponse(
              `Scheduled time must be within operating hours (${open} - ${close})`,
              400
            )
          }
        }
      }
    }

    // Check if canteen is accepting scheduled orders
    // This could be a setting in the canteen table, for now we'll just validate time

    return successResponse({
      valid: true,
      message: "Scheduled time is valid",
    })
  },
})

