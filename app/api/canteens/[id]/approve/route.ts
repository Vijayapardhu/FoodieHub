import { NextRequest, NextResponse } from "next/server"
import { createSecureHandler, successResponse, errorResponse } from "@/lib/api/middleware"
import { z } from "zod"

const approvalSchema = z.object({
  approve: z.boolean(),
  reason: z.string().optional(),
})

export const POST = createSecureHandler({
  allowedRoles: ["admin"],
  schema: approvalSchema,
  handler: async (request, { user, supabase, body }) => {
    try {
      const canteenId = request.nextUrl.pathname.split("/")[3] // Extract from /api/canteens/[id]/approve

      if (!canteenId) {
        return errorResponse("Canteen ID is required", 400)
      }

      const { approve, reason } = body as { approve: boolean; reason?: string }

      // Get canteen
      const { data: canteen, error: fetchError } = await supabase
        .from("canteens")
        .select("id, owner_id, is_approved")
        .eq("id", canteenId)
        .single()

      if (fetchError || !canteen) {
        return errorResponse("Canteen not found", 404)
      }

      // Update approval status
      const updateData: any = {
        is_approved: approve,
        approved_by: approve ? user.id : null,
        approved_at: approve ? new Date().toISOString() : null,
      }

      if (!approve && reason) {
        updateData.rejection_reason = reason
      } else if (approve) {
        updateData.rejection_reason = null
      }

      const { data: updatedCanteen, error: updateError } = await supabase
        .from("canteens")
        .update(updateData)
        .eq("id", canteenId)
        .select("id, name, is_approved, approved_by, approved_at")
        .single()

      if (updateError) {
        console.error("Error updating canteen approval:", updateError)
        return errorResponse("Failed to update approval status", 500)
      }

      // Send notification to owner
      if (canteen.owner_id) {
        const notificationTitle = approve
          ? "Canteen Approved"
          : "Canteen Approval Rejected"
        const notificationMessage = approve
          ? "Your canteen has been approved and is now visible to users!"
          : `Your canteen approval was rejected. ${reason ? `Reason: ${reason}` : ""}`

        await supabase.from("notifications").insert({
          user_id: canteen.owner_id,
          title: notificationTitle,
          message: notificationMessage,
          type: "system",
        })
      }

      return successResponse(
        {
          id: updatedCanteen.id,
          name: updatedCanteen.name,
          is_approved: updatedCanteen.is_approved,
          approved_by: updatedCanteen.approved_by,
          approved_at: updatedCanteen.approved_at,
        },
        approve ? "Canteen approved successfully" : "Canteen rejected"
      )
    } catch (error: any) {
      console.error("Error in canteen approval handler:", error)
      return errorResponse("Internal server error", 500)
    }
  },
})

