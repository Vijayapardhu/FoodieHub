import { NextRequest } from "next/server"
import {
  createSecureHandler,
  successResponse,
  errorResponse,
  isValidUUID,
} from "@/lib/api/middleware"
import { formatEntitiesResponse } from "@/lib/api/response-formatter"

// GET - Get loyalty point transactions
export const GET = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  handler: async (request, { user, supabase }) => {
    const canteenId = request.nextUrl.searchParams.get("canteen_id")
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50")
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0")

    // Validate limit
    if (limit < 1 || limit > 100) {
      return errorResponse("Limit must be between 1 and 100", 400)
    }

    let query = supabase
      .from("loyalty_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (canteenId) {
      if (!isValidUUID(canteenId)) {
        return errorResponse("Invalid canteen ID", 400)
      }
      query = query.eq("canteen_id", canteenId)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error("Error fetching transactions:", error)
      return errorResponse("Failed to fetch transactions", 500)
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("loyalty_transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (canteenId) {
      countQuery = countQuery.eq("canteen_id", canteenId)
    }

    const { count } = await countQuery

    // Format transactions to exclude internal IDs
    const formattedTransactions = (transactions || []).map((txn: any) => {
      const { id, user_id, canteen_id, order_id, ...rest } = txn
      return {
        ...rest,
        // Remove internal IDs, only keep transaction data
      }
    })

    return successResponse({
      transactions: formattedTransactions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  },
})

