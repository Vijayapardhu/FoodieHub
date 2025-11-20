import { createClient } from "@/lib/supabase/client"

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "order" | "promotion" | "system" | "feedback" = "system",
  metadata?: Record<string, any>
) {
  const supabase = createClient()

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    metadata: metadata || null,
  })

  if (error) {
    console.error("Failed to create notification:", error)
    return false
  }

  return true
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission === "denied") {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === "granted"
}

