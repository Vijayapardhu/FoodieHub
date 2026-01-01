import { createClient } from "@/lib/supabase/server"
import { isValidUUID } from "./middleware"

/**
 * Resolve alias to ID for database queries
 */
export async function resolveCanteenIdentifier(identifier: string): Promise<string | null> {
  const supabase = await createClient()
  
  if (isValidUUID(identifier)) {
    // It's already a UUID
    const { data } = await supabase
      .from("canteens")
      .select("id")
      .eq("id", identifier)
      .single()
    return data?.id || null
  }
  
  // It's an alias
  const { data } = await supabase
    .from("canteens")
    .select("id")
    .eq("alias", identifier)
    .single()
  
  return data?.id || null
}

export async function resolveItemIdentifier(identifier: string, canteenId?: string): Promise<string | null> {
  const supabase = await createClient()
  
  let query = supabase.from("items").select("id")
  
  if (canteenId) {
    query = query.eq("canteen_id", canteenId)
  }
  
  if (isValidUUID(identifier)) {
    query = query.eq("id", identifier)
  } else {
    query = query.eq("alias", identifier)
  }
  
  const { data } = await query.single()
  return data?.id || null
}

export async function resolveTemplateIdentifier(identifier: string, userId?: string): Promise<string | null> {
  const supabase = await createClient()
  
  let query = supabase.from("order_templates").select("id")
  
  if (userId) {
    query = query.eq("user_id", userId)
  }
  
  if (isValidUUID(identifier)) {
    query = query.eq("id", identifier)
  } else {
    query = query.eq("alias", identifier)
  }
  
  const { data } = await query.single()
  return data?.id || null
}


