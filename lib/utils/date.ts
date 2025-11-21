import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns"

/**
 * Date utility functions
 */

export function formatOrderDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  
  if (isToday(d)) {
    return `Today at ${format(d, "h:mm a")}`
  }
  
  if (isYesterday(d)) {
    return `Yesterday at ${format(d, "h:mm a")}`
  }
  
  return format(d, "MMM d, yyyy 'at' h:mm a")
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function isOrderCancellable(orderDate: string | Date): boolean {
  const d = typeof orderDate === "string" ? new Date(orderDate) : orderDate
  const now = new Date()
  const diffInMinutes = (now.getTime() - d.getTime()) / (1000 * 60)
  return diffInMinutes <= 5 // 5 minutes cancellation window
}

export function getEstimatedReadyTime(
  orderDate: string | Date,
  estimatedMinutes: number = 20
): Date {
  const d = typeof orderDate === "string" ? new Date(orderDate) : orderDate
  return new Date(d.getTime() + estimatedMinutes * 60 * 1000)
}

