import { NextRequest, NextResponse } from "next/server"
import { createSecureHandler, successResponse, errorResponse } from "@/lib/api/middleware"
import { z } from "zod"
import { Database } from "@/types/database.types"

type UserRole = Database["public"]["Enums"]["user_role"]

const updateRoleSchema = z.object({
  role: z.enum(["user", "canteen_owner", "admin"]),
})

export const PUT = createSecureHandler({
  allowedRoles: ["admin"],
  schema: updateRoleSchema,
  handler: async (request, { user, supabase, body }) => {
    try {
      const userId = request.nextUrl.pathname.split("/")[3] // Extract user ID from /api/users/[id]/role

      if (!userId) {
        return errorResponse("User ID is required", 400)
      }

      // Prevent users from changing their own role
      if (userId === user.id) {
        return errorResponse("You cannot change your own role", 403)
      }

      const { role } = body as { role: UserRole }

      // Update user role
      const { data, error } = await supabase
        .from("users")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        console.error("Error updating user role:", error)
        return errorResponse("Failed to update user role", 500)
      }

      return successResponse(
        {
          id: data.id,
          email: data.email,
          role: data.role,
          full_name: data.full_name,
        },
        "User role updated successfully"
      )
    } catch (error: any) {
      console.error("Error in update role handler:", error)
      return errorResponse("Internal server error", 500)
    }
  },
})

