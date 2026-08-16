import { createSecureHandler, successResponse, errorResponse } from "@/lib/api/middleware"
import { z } from "zod"
import { defaultOperatingHours } from "@/lib/utils/operating-hours"

const canteenRegistrationSchema = z.object({
  name: z.string().min(1, "Canteen name is required").max(100),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  contact_phone: z.string().max(20).optional(),
  operating_hours: z
    .record(
      z.string(),
      z.object({
        open: z.string(),
        close: z.string(),
        closed: z.boolean().optional(),
      })
    )
    .optional(),
})

export const POST = createSecureHandler({
  allowedRoles: ["canteen_owner", "admin"],
  schema: canteenRegistrationSchema,
  handler: async (request, { user, supabase, body }) => {
    try {
      // Check if user already owns a canteen
      const { data: existingCanteen } = await supabase
        .from("canteens")
        .select("id")
        .eq("owner_id", user.id)
        .single()

      if (existingCanteen && user.role !== "admin") {
        return errorResponse(
          "You already own a canteen. Please update your existing canteen instead.",
          400
        )
      }

      const { name, description, address, contact_phone, operating_hours } =
        body as {
          name: string
          description?: string
          address?: string
          contact_phone?: string
          operating_hours?: Record<string, any>
        }

      // Create canteen (needs admin approval)
      const { data: canteen, error } = await supabase
        .from("canteens")
        .insert({
          owner_id: user.id,
          name,
          description: description || null,
          address: address || null,
          contact_phone: contact_phone || null,
          // Shape must match lib/utils/operating-hours so the settings editor
          // can read it back without falling through to its defaults.
          operating_hours: operating_hours || defaultOperatingHours(),
          is_open: false, // Owner flips this on when they start serving
          is_approved: false, // Needs admin approval
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating canteen:", error)
        return errorResponse("Failed to create canteen", 500)
      }

      return successResponse(
        {
          id: canteen.id,
          name: canteen.name,
          owner_id: canteen.owner_id,
        },
        "Canteen registered successfully"
      )
    } catch (error: any) {
      console.error("Error in canteen registration handler:", error)
      return errorResponse("Internal server error", 500)
    }
  },
})

