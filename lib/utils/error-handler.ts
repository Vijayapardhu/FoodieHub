/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function handleError(error: unknown): {
  message: string
  code?: string
  statusCode?: number
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message || "An unexpected error occurred",
    }
  }

  return {
    message: "An unexpected error occurred",
  }
}

export function logError(error: unknown, context?: string) {
  const errorInfo = handleError(error)
  console.error(`[${context || "Error"}]`, {
    message: errorInfo.message,
    code: errorInfo.code,
    statusCode: errorInfo.statusCode,
    timestamp: new Date().toISOString(),
  })
}

