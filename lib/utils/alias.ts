/**
 * Generate a URL-safe alias from a name
 * Converts name to lowercase, replaces spaces with hyphens, removes special chars
 */
export function generateAlias(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .slice(0, 100) // Max length
}

/**
 * Generate a unique alias with random suffix
 * Format: base-alias-{random8chars}
 */
export function generateUniqueAlias(name: string): string {
  const base = generateAlias(name)
  const randomSuffix = Math.random().toString(36).substring(2, 10)
  return `${base}-${randomSuffix}`
}

/**
 * Generate alias from multiple components
 */
export function generateCompositeAlias(...components: string[]): string {
  return components
    .map((c) => generateAlias(c))
    .filter((c) => c.length > 0)
    .join("-")
}

/**
 * Generate short code alias (for tokens/IDs)
 * Format: {prefix}-{random12chars}
 */
export function generateShortCode(prefix: string): string {
  const random = Math.random().toString(36).substring(2, 14)
  return `${prefix}-${random}`
}

/**
 * Validate alias format
 */
export function isValidAlias(alias: string): boolean {
  // Alias should be lowercase alphanumeric with hyphens, 3-100 chars
  const aliasRegex = /^[a-z0-9]([a-z0-9-]{1,98}[a-z0-9])?$/
  return aliasRegex.test(alias) && alias.length >= 3 && alias.length <= 100
}

/**
 * Extract name from alias (reverse operation - approximate)
 */
export function aliasToName(alias: string): string {
  return alias
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

