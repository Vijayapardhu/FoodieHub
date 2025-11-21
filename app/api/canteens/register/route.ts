import { NextRequest, NextResponse } from "next/server"
import { createSecureHandler, successResponse, errorResponse } from "@/lib/api/middleware"
import { z } from "zod"

const canteenRegistrationSchema = z.object({
  name: z.string().min(1, "Canteen name is required").max(100),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  operating_hours: z
    .record(
      z.string(),
      z.object({
        open: z.string(),
        close: z.string(),
        is_open: z.boolean().optional(),
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

      const { name, description, address, operating_hours } = body as {
        name: string
        description?: string
        address?: string
        operating_hours?: Record<string, any>
      }

      // Default operating hours if not provided
      const defaultOperatingHours = {
        monday: { open: "08:00", close: "20:00", is_open: true },
        tuesday: { open: "08:00", close: "20:00", is_open: true },
        wednesday: { open: "08:00", close: "20:00", is_open: true },
        thursday: { open: "08:00", close: "20:00", is_open: true },
        friday: { open: "08:00", close: "20:00", is_open: true },
        saturday: { open: "09:00", close: "18:00", is_open: true },
        sunday: { open: "10:00", close: "16:00", is_open: false },
      }

      // Create canteen (needs admin approval)
      const { data: canteen, error } = await supabase
        .from("canteens")
        .insert({
          owner_id: user.id,
          name,
          description: description || null,
          address: address || null,
          operating_hours: operating_hours || defaultOperatingHours,
          is_open: false, // Start as closed until owner opens it
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

