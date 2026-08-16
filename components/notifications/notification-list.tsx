"use client"

import Link from "next/link"
import {
  Bell,
  BellOff,
  ChevronRight,
  Megaphone,
  MessageSquare,
  Receipt,
  Settings2,
} from "@/components/ui/icons"
import { formatDistanceToNow } from "date-fns"
import { Database } from "@/types/database.types"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils/cn"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

const typeIcon = {
  order: Receipt,
  promotion: Megaphone,
  system: Settings2,
  feedback: MessageSquare,
} as const

/**
 * Where a notification should take you.
 *
 * The database triggers already stamp the order id (and token, and status)
 * into `metadata` — it was just never read, so every alert was a dead end.
 * "Order ABC123 is ready" now opens the token screen, which is the one thing
 * you want in your hand when you're walking to the counter.
 */
export function notificationHref(notification: Notification): string | null {
  const metadata = (notification.metadata ?? {}) as Record<string, unknown>
  const orderId = typeof metadata.order_id === "string" ? metadata.order_id : null
  // The trigger stamps the pickup token too, which is what orders are
  // addressed by now; the id is the fallback for older rows.
  const token = typeof metadata.token === "string" ? metadata.token : null
  const canteenId =
    typeof metadata.canteen_id === "string" ? metadata.canteen_id : null

  if (orderId) {
    // "Enjoy your meal. Tap to rate it." — so land on the form, not the token.
    const handle = token || orderId
    return metadata.status === "completed"
      ? `/orders/${handle}/feedback`
      : `/orders/${handle}`
  }
  if (canteenId) return `/canteen/${canteenId}`
  if (notification.type === "feedback") return "/profile/feedback"
  return null
}

interface NotificationRowProps {
  notification: Notification
  /** Fired on tap — marks read, and lets a sheet close itself before routing. */
  onOpen: (notification: Notification) => void
}

export function NotificationRow({ notification, onOpen }: NotificationRowProps) {
  const Icon = typeIcon[notification.type as keyof typeof typeIcon] ?? Bell
  const unread = !notification.is_read
  const href = notificationHref(notification)

  const body = (
    <>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          unread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {notification.title}
          </span>
          {unread ? (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          ) : null}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {notification.message}
        </span>
        <span className="mt-1.5 block text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </span>
      </span>

      {href ? (
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 self-center text-muted-foreground" />
      ) : null}
    </>
  )

  const className = cn(
    "flex w-full gap-3 rounded-2xl border p-3.5 text-left transition-colors active:scale-[0.99]",
    unread ? "border-primary/25 bg-primary-soft" : "border-border bg-card"
  )

  // Anything with a destination is a real link, so it keeps middle-click,
  // long-press and "open in new tab" rather than swallowing them in onClick.
  if (href) {
    return (
      <Link href={href} onClick={() => onOpen(notification)} className={className}>
        {body}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={className}
    >
      {body}
    </button>
  )
}

export function NotificationList({
  notifications,
  onOpen,
  compact = false,
}: {
  notifications: Notification[]
  onOpen: (notification: Notification) => void
  compact?: boolean
}) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title="Nothing here yet"
        description="Order updates and canteen offers will show up in this list."
        compact={compact}
      />
    )
  }

  return (
    <ul className="space-y-2">
      {notifications.map((notification) => (
        <li key={notification.id}>
          <NotificationRow notification={notification} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}
