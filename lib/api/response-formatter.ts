import { generateAlias } from "@/lib/utils/alias"

/**
 * Format API response to hide internal IDs and use aliases instead
 */

interface EntityWithAlias {
  id?: string
  alias?: string
  [key: string]: any
}

/**
 * Remove ID from entity and ensure alias exists
 */
export function formatEntityResponse<T extends EntityWithAlias>(
  entity: T | null,
  generateAliasFrom?: (entity: T) => string
): Omit<T, "id"> & { alias: string } | null {
  if (!entity) return null

  const { id, ...rest } = entity
  const alias = entity.alias || (generateAliasFrom ? generateAliasFrom(entity) : generateAlias(entity.name || ""))
  
  return {
    ...rest,
    alias,
  } as any
}

/**
 * Format array of entities, removing all internal IDs
 */
export function formatEntitiesResponse<T extends EntityWithAlias>(
  entities: T[],
  generateAliasFrom?: (entity: T) => string
): Array<Omit<T, "id" | "user_id" | "canteen_id"> & { alias: string }> {
  return entities
    .map((entity) => {
      const formatted = formatEntityResponse(entity, generateAliasFrom)
      if (!formatted) return null
      
      // Remove user_id and canteen_id if they exist
      const { user_id, canteen_id, ...rest } = formatted as any
      return rest as Omit<T, "id" | "user_id" | "canteen_id"> & { alias: string }
    })
    .filter((entity): entity is NonNullable<typeof entity> => entity !== null)
}

/**
 * Format response with nested entities
 */
export function formatNestedResponse<T extends EntityWithAlias>(
  data: T,
  nestedFields: string[] = []
): any {
  const { id, ...rest } = data
  const alias = data.alias || generateAlias((data as any).name || "")
  
  const formatted: any = {
    ...rest,
    alias,
  }

  // Format nested entities
  for (const field of nestedFields) {
    if (formatted[field]) {
      if (Array.isArray(formatted[field])) {
        formatted[field] = formatEntitiesResponse(formatted[field])
      } else if (typeof formatted[field] === "object" && formatted[field] !== null) {
        formatted[field] = formatEntityResponse(formatted[field])
      }
    }
  }

  return formatted
}

/**
 * Replace ID references with aliases in response
 */
export function replaceIdsWithAliases<T extends Record<string, any>>(
  data: T,
  aliasMap: Map<string, string>
): T {
  const formatted: any = { ...data }
  
  for (const [key, value] of Object.entries(formatted)) {
    if (typeof value === "string" && aliasMap.has(value)) {
      formatted[key] = aliasMap.get(value)
    } else if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        formatted[key] = value.map((item) =>
          typeof item === "object" && item !== null
            ? replaceIdsWithAliases(item, aliasMap)
            : aliasMap.has(item) ? aliasMap.get(item) : item
        )
      } else {
        formatted[key] = replaceIdsWithAliases(value, aliasMap)
      }
    }
  }
  
  return formatted as T
}

