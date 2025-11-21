import { NextRequest } from "next/server"
import { z } from "zod"
import {
  createSecureHandler,
  successResponse,
  errorResponse,
  sanitizeInput,
} from "@/lib/api/middleware"
import { formatEntityResponse } from "@/lib/api/response-formatter"

const updatePreferencesSchema = z.object({
  allergies: z.array(z.string().max(50)).max(20).optional(),
  dietary_restrictions: z.array(z.string().max(50)).max(20).optional(),
  preferred_cuisines: z.array(z.string().max(50)).max(20).optional(),
})

// GET - Get user dietary preferences
export const GET = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  handler: async (request, { user, supabase }) => {
    const { data: preferences, error } = await supabase
      .from("user_dietary_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching preferences:", error)
      return errorResponse("Failed to fetch preferences", 500)
    }

    // Format response to exclude internal IDs
    const formattedPreferences = preferences
      ? formatEntityResponse(preferences)
      : {
          allergies: [],
          dietary_restrictions: [],
          preferred_cuisines: [],
        }

    return successResponse(formattedPreferences)
  },
})

// POST/PUT - Update dietary preferences
export const POST = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  schema: updatePreferencesSchema,
  handler: async (request, { user, supabase, body }) => {
    // Sanitize arrays
    const allergies = body.allergies
      ? body.allergies.map((a: string) => sanitizeInput(a).slice(0, 50))
      : []
    const dietary_restrictions = body.dietary_restrictions
      ? body.dietary_restrictions.map((r: string) => sanitizeInput(r).slice(0, 50))
      : []
    const preferred_cuisines = body.preferred_cuisines
      ? body.preferred_cuisines.map((c: string) => sanitizeInput(c).slice(0, 50))
      : []

    // Check if preferences exist
    const { data: existing } = await supabase
      .from("user_dietary_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("user_dietary_preferences")
        .update({
          allergies,
          dietary_restrictions,
          preferred_cuisines,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating preferences:", error)
        return errorResponse("Failed to update preferences", 500)
      }
      result = data
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("user_dietary_preferences")
        .insert({
          user_id: user.id,
          allergies,
          dietary_restrictions,
          preferred_cuisines,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating preferences:", error)
        return errorResponse("Failed to create preferences", 500)
      }
      result = data
    }

    // Format response to exclude internal IDs
    const formattedResult = formatEntityResponse(result)

    return successResponse(formattedResult, "Preferences updated successfully")
  },
})

export const PUT = POST // Same handler for PUT

