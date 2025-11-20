/**
 * Generates a unique alphanumeric token
 * @param length - Length of the token (default: 6)
 * @returns Unique token string
 */
export function generateToken(length: number = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let token = ""
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return token
}

/**
 * Validates token format
 * @param token - Token to validate
 * @returns True if token is valid
 */
export function isValidToken(token: string): boolean {
  return /^[A-Z0-9]{4,8}$/.test(token)
}

