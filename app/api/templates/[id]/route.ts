import { NextRequest } from "next/server"
import { z } from "zod"
import {
  createSecureHandler,
  successResponse,
  errorResponse,
  isValidUUID,
  sanitizeInput,
  checkResourceOwnership,
} from "@/lib/api/middleware"
import { formatEntityResponse } from "@/lib/api/response-formatter"
import { createClient } from "@/lib/supabase/server"

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional().nullable(),
  items: z.array(
    z.object({
      item_id: z.string().min(1), // Can be UUID or alias
      quantity: z.number().int().positive(),
    })
  ).min(1).max(20).optional(),
})

// GET - Get single template by alias or ID
export const GET = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  handler: async (request, { user, supabase }) => {
    const identifier = request.nextUrl.pathname.split("/").pop()

    if (!identifier) {
      return errorResponse("Invalid template identifier", 400)
    }

    // Try to find by alias first, then by ID
    let query = supabase
      .from("order_templates")
      .select("*")
      .eq("user_id", user.id) // Ensure user owns the template

    if (isValidUUID(identifier)) {
      query = query.eq("id", identifier)
    } else {
      query = query.eq("alias", identifier)
    }

    const { data: template, error } = await query.single()

    if (error || !template) {
      return errorResponse("Template not found", 404)
    }

    // Format response to use alias instead of ID
    const formattedTemplate = formatEntityResponse(template)

    return successResponse(formattedTemplate)
  },
})

// PUT - Update template by alias or ID
export const PUT = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  schema: updateTemplateSchema,
  handler: async (request, { user, supabase, body }) => {
    const identifier = request.nextUrl.pathname.split("/").pop()

    if (!identifier) {
      return errorResponse("Invalid template identifier", 400)
    }

    // Find template by alias or ID
    let findQuery = supabase
      .from("order_templates")
      .select("id")
      .eq("user_id", user.id)

    if (isValidUUID(identifier)) {
      findQuery = findQuery.eq("id", identifier)
    } else {
      findQuery = findQuery.eq("alias", identifier)
    }

    const { data: template, error: findError } = await findQuery.single()

    if (findError || !template) {
      return errorResponse("Template not found or access denied", 404)
    }

    const templateId = template.id

    // Get existing template to preserve canteen_id
    const { data: existing, error: fetchError } = await supabase
      .from("order_templates")
      .select("canteen_id")
      .eq("id", templateId)
      .single()

    if (fetchError || !existing) {
      return errorResponse("Template not found", 404)
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.name) {
      updateData.name = sanitizeInput(body.name)
    }
    if (body.description !== undefined) {
      updateData.description = body.description ? sanitizeInput(body.description) : null
    }

    // If items are being updated, verify they exist and belong to canteen
    if (body.items) {
      const itemIdentifiers = body.items.map((item: any) => item.item_id)
      
      // Split into UUIDs and aliases
      const itemUUIDs = itemIdentifiers.filter((id: string) => isValidUUID(id))
      const itemAliases = itemIdentifiers.filter((id: string) => !isValidUUID(id))
      
      let allItems: any[] = []
      
      if (itemUUIDs.length > 0) {
        const { data: itemsById, error: errorById } = await supabase
          .from("items")
          .select("id, canteen_id")
          .in("id", itemUUIDs)
        
        if (errorById) {
          return errorResponse("Error fetching items by ID", 500)
        }
        if (itemsById) allItems.push(...itemsById)
      }
      
      if (itemAliases.length > 0) {
        const { data: itemsByAlias, error: errorByAlias } = await supabase
          .from("items")
          .select("id, canteen_id")
          .in("alias", itemAliases)
        
        if (errorByAlias) {
          return errorResponse("Error fetching items by alias", 500)
        }
        if (itemsByAlias) allItems.push(...itemsByAlias)
      }

      if (allItems.length !== itemIdentifiers.length) {
        return errorResponse("Some items not found", 404)
      }

      const invalidItems = allItems.filter((item) => item.canteen_id !== existing.canteen_id)
      if (invalidItems.length > 0) {
        return errorResponse("Some items do not belong to this canteen", 400)
      }
      
      // Map items to use internal IDs
      updateData.items = body.items.map((item: any) => {
        const foundItem = allItems.find((i) => 
          i.id === item.item_id || i.alias === item.item_id
        )
        return {
          item_id: foundItem?.id || item.item_id,
          quantity: item.quantity,
        }
      })
    }

    const { data: updatedTemplate, error } = await supabase
      .from("order_templates")
      .update(updateData)
      .eq("id", templateId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating template:", error)
      return errorResponse("Failed to update template", 500)
    }

    // Format response to use alias instead of ID
    const formattedTemplate = formatEntityResponse(updatedTemplate)

    return successResponse(formattedTemplate, "Template updated successfully")
  },
})

// DELETE - Delete template by alias or ID
export const DELETE = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  handler: async (request, { user, supabase }) => {
    const identifier = request.nextUrl.pathname.split("/").pop()

    if (!identifier) {
      return errorResponse("Invalid template identifier", 400)
    }

    // Find template by alias or ID
    let findQuery = supabase
      .from("order_templates")
      .select("id")
      .eq("user_id", user.id)

    if (isValidUUID(identifier)) {
      findQuery = findQuery.eq("id", identifier)
    } else {
      findQuery = findQuery.eq("alias", identifier)
    }

    const { data: template, error: findError } = await findQuery.single()

    if (findError || !template) {
      return errorResponse("Template not found or access denied", 404)
    }

    const { error } = await supabase
      .from("order_templates")
      .delete()
      .eq("id", template.id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting template:", error)
      return errorResponse("Failed to delete template", 500)
    }

    return successResponse(null, "Template deleted successfully")
  },
})

