import { NextRequest } from "next/server"
import {
  createSecureHandler,
  successResponse,
  errorResponse,
  isValidUUID,
} from "@/lib/api/middleware"
import { formatEntitiesResponse } from "@/lib/api/response-formatter"

// GET - Get loyalty points for user
export const GET = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  handler: async (request, { user, supabase }) => {
    const canteenId = request.nextUrl.searchParams.get("canteen_id")

    // If canteen_id provided, get points for specific canteen
    // Otherwise, get platform-wide points (where canteen_id is NULL)
    let query = supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", user.id)

    if (canteenId) {
      if (!isValidUUID(canteenId)) {
        return errorResponse("Invalid canteen ID", 400)
      }
      query = query.eq("canteen_id", canteenId)
    } else {
      query = query.is("canteen_id", null)
    }

    const { data: points, error } = await query

    if (error) {
      console.error("Error fetching loyalty points:", error)
      return errorResponse("Failed to fetch loyalty points", 500)
    }

    // Format response to exclude internal IDs
    const formattedPoints = (points || []).map((point: any) => {
      const { id, user_id, canteen_id, ...rest } = point
      // Get canteen alias if canteen_id exists
      return {
        ...rest,
        // Keep canteen_id for internal reference, but we could add canteen_alias if needed
      }
    })

    return successResponse(formattedPoints)
  },
})

