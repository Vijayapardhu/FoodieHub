import { NextRequest } from "next/server"
import { z } from "zod"
import {
  createSecureHandler,
  successResponse,
  errorResponse,
  isValidUUID,
  sanitizeInput,
  checkCanteenAccess,
} from "@/lib/api/middleware"
import { formatEntitiesResponse, formatEntityResponse } from "@/lib/api/response-formatter"

// Validation schemas (accept aliases or UUIDs)
const createTemplateSchema = z.object({
  canteen_id: z.string().min(1, "Canteen identifier required"), // Can be UUID or alias
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  description: z.string().max(200, "Description too long").optional().nullable(),
  items: z.array(
    z.object({
      item_id: z.string().min(1, "Item identifier required"), // Can be UUID or alias
      quantity: z.number().int().positive("Quantity must be positive"),
    })
  ).min(1, "At least one item is required").max(20, "Too many items"),
})

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional().nullable(),
  items: z.array(
    z.object({
      item_id: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1).max(20).optional(),
})

// GET - List templates for a canteen (by alias or ID)
export const GET = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  handler: async (request, { user, supabase }) => {
    const canteenIdentifier = request.nextUrl.searchParams.get("canteen_id") || 
                               request.nextUrl.searchParams.get("canteen_alias")

    if (!canteenIdentifier) {
      return errorResponse("canteen_id or canteen_alias is required", 400)
    }

    // Find canteen by alias or ID
    let canteenQuery = supabase.from("canteens").select("id, alias")
    
    let canteenId: string
    if (isValidUUID(canteenIdentifier)) {
      canteenQuery = canteenQuery.eq("id", canteenIdentifier)
    } else {
      canteenQuery = canteenQuery.eq("alias", canteenIdentifier)
    }

    const { data: canteen, error: canteenError } = await canteenQuery.single()

    if (canteenError || !canteen) {
      return errorResponse("Canteen not found", 404)
    }

    canteenId = canteen.id

    // Fetch templates
    const { data: templates, error } = await supabase
      .from("order_templates")
      .select("*")
      .eq("user_id", user.id)
      .eq("canteen_id", canteenId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching templates:", error)
      return errorResponse("Failed to fetch templates", 500)
    }

    // Format response to use aliases instead of IDs
    const formattedTemplates = formatEntitiesResponse(templates || [], (template) => 
      template.alias || `${canteen.alias || "canteen"}-${template.name.toLowerCase().replace(/\s+/g, "-")}`
    ).map((template: any) => {
      // Remove internal IDs and replace with aliases
      const { canteen_id, user_id, ...rest } = template
      return {
        ...rest,
        canteen_alias: canteen.alias || null,
        // Format items to use aliases if they're in the items array
        items: template.items?.map((item: any) => {
          if (typeof item === "object" && item.item_id) {
            return {
              ...item,
              // Don't expose item_id, use alias instead (if available in response)
            }
          }
          return item
        }) || [],
      }
    })

    return successResponse(formattedTemplates)
  },
})

// POST - Create new template
export const POST = createSecureHandler({
  allowedRoles: ["user", "canteen_owner", "admin"],
  schema: createTemplateSchema,
  handler: async (request, { user, supabase, body }) => {
    // Find canteen by alias or ID
    let canteenQuery = supabase.from("canteens").select("id, alias")
    
    let canteenId: string
    if (isValidUUID(body.canteen_id)) {
      canteenQuery = canteenQuery.eq("id", body.canteen_id)
    } else {
      canteenQuery = canteenQuery.eq("alias", body.canteen_id)
    }

    const { data: canteen, error: canteenError } = await canteenQuery.single()

    if (canteenError || !canteen) {
      return errorResponse("Canteen not found", 404)
    }

    canteenId = canteen.id

    // Verify all items exist and belong to the canteen
    // Items can be identified by UUID or alias
    const itemIdentifiers = body.items.map((item: any) => item.item_id)
    
    // Try to find items by ID or alias
    let itemsQuery = supabase.from("items").select("id, canteen_id, alias")
    
    // Split into UUIDs and aliases
    const itemUUIDs = itemIdentifiers.filter((id: string) => isValidUUID(id))
    const itemAliases = itemIdentifiers.filter((id: string) => !isValidUUID(id))
    
    let allItems: any[] = []
    
    if (itemUUIDs.length > 0) {
      const { data: itemsById, error: errorById } = await supabase
        .from("items")
        .select("id, canteen_id, alias")
        .in("id", itemUUIDs)
      
      if (errorById) {
        return errorResponse("Error fetching items by ID", 500)
      }
      if (itemsById) allItems.push(...itemsById)
    }
    
    if (itemAliases.length > 0) {
      const { data: itemsByAlias, error: errorByAlias } = await supabase
        .from("items")
        .select("id, canteen_id, alias")
        .in("alias", itemAliases)
      
      if (errorByAlias) {
        return errorResponse("Error fetching items by alias", 500)
      }
      if (itemsByAlias) allItems.push(...itemsByAlias)
    }

    if (allItems.length !== itemIdentifiers.length) {
      return errorResponse("Some items not found", 404)
    }

    // Verify all items belong to the specified canteen
    const invalidItems = allItems.filter((item) => item.canteen_id !== canteenId)
    if (invalidItems.length > 0) {
      return errorResponse("Some items do not belong to this canteen", 400)
    }

    // Sanitize name and description
    const sanitizedName = sanitizeInput(body.name)
    const sanitizedDescription = body.description ? sanitizeInput(body.description) : null

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("order_templates")
      .select("id")
      .eq("user_id", user.id)
      .eq("canteen_id", canteenId)
      .eq("name", sanitizedName)
      .maybeSingle()

    if (existing) {
      return errorResponse("Template with this name already exists", 409)
    }

    // Map items to use internal IDs (convert aliases to IDs)
    const itemsWithIds = body.items.map((item: any) => {
      const foundItem = allItems.find((i) => 
        i.id === item.item_id || i.alias === item.item_id
      )
      return {
        item_id: foundItem?.id || item.item_id,
        quantity: item.quantity,
      }
    })

    // Create template (alias will be auto-generated by trigger)
    const { data: template, error } = await supabase
      .from("order_templates")
      .insert({
        user_id: user.id,
        canteen_id: canteenId,
        name: sanitizedName,
        description: sanitizedDescription,
        items: itemsWithIds,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating template:", error)
      return errorResponse("Failed to create template", 500)
    }

    // Format response to use alias instead of ID
    const formattedTemplate = formatEntityResponse(template)

    return successResponse(formattedTemplate, "Template created successfully")
  },
})

