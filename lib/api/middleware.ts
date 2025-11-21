import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Database } from "@/types/database.types"

type UserRole = Database["public"]["Enums"]["user_role"]

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    role: UserRole
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Middleware to authenticate API requests
 */
export async function authenticateRequest(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user role from database
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 403 }
      )
    }

    return {
      user: {
        id: user.id,
        email: user.email || "",
        role: profile.role as UserRole,
      },
      supabase,
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Authentication failed", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      )
    }

    return authResult
  }
}

/**
 * Middleware to validate request body with Zod schema
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json()
      const validated = await schema.parseAsync(body)
      return { body: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            details: error.errors,
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      )
    }
  }
}

/**
 * Combined middleware for authenticated requests with role check and validation
 */
export function createSecureHandler(options: {
  allowedRoles?: UserRole[]
  schema?: z.ZodType
  handler: (request: NextRequest, context: {
    user: { id: string; email: string; role: UserRole }
    supabase: Awaited<ReturnType<typeof createClient>>
    body?: any
  }) => Promise<NextResponse<ApiResponse>>
}) {
  return async (request: NextRequest) => {
    try {
      // Authenticate
      const authResult = await authenticateRequest(request)
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const { user, supabase } = authResult

      // Check role if specified
      if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Insufficient permissions" },
          { status: 403 }
        )
      }

      // Validate body if schema provided
      let body = undefined
      if (options.schema) {
        const validationResult = await validateBody(options.schema)(request)
        if (validationResult instanceof NextResponse) {
          return validationResult
        }
        body = validationResult.body
      }

      // Rate limiting check (simple implementation)
      const rateLimitResult = await checkRateLimit(user.id, request.nextUrl.pathname)
      if (rateLimitResult) {
        return rateLimitResult
      }

      // Call handler
      return await options.handler(request, { user, supabase, body })
    } catch (error: any) {
      console.error("API Error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Simple rate limiting (in-memory, for production use Redis or similar)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

async function checkRateLimit(userId: string, path: string, maxRequests = 100, windowMs = 60000) {
  const key = `${userId}:${path}`
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return null
  }

  if (record.count >= maxRequests) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  record.count++
  return null
}

/**
 * Utility to check if user owns a resource
 */
export async function checkResourceOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  table: string,
  resourceId: string,
  userIdColumn = "user_id"
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(userIdColumn)
      .eq("id", resourceId)
      .single()

    if (error || !data) {
      return false
    }

    return (data as Record<string, any>)[userIdColumn] === userId
  } catch {
    return false
  }
}

/**
 * Utility to check if user owns or manages a canteen
 */
export async function checkCanteenAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  canteenId: string,
  userRole: UserRole
): Promise<boolean> {
  try {
    if (userRole === "admin") {
      return true // Admins have access to all canteens
    }

    const { data, error } = await supabase
      .from("canteens")
      .select("owner_id")
      .eq("id", canteenId)
      .single()

    if (error || !data) {
      return false
    }

    return data.owner_id === userId
  } catch {
    return false
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 10000) // Max length
}

/**
 * Validate UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  })
}

/**
 * Create error response
 */
export function errorResponse(
  error: string,
  statusCode = 400,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status: statusCode }
  )
}

