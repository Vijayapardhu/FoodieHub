"use client"

import { useState } from "react"
import { CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Chip, ChipRail } from "@/components/ui/chip"
import { ListSkeleton } from "@/components/ui/loading-state"
import { NotificationList } from "@/components/notifications/notification-list"
import { useNotifications } from "@/lib/hooks/use-notifications"

type Filter = "all" | "unread" | "order" | "promotion"

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "order", label: "Orders" },
  { value: "promotion", label: "Offers" },
]

export function NotificationsPageContent() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } =
    useNotifications()
  const [filter, setFilter] = useState<Filter>("all")

  const visible = notifications.filter((notification) => {
    if (filter === "unread") return !notification.is_read
    if (filter === "order" || filter === "promotion")
      return notification.type === filter
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <ChipRail>
          {FILTERS.map(({ value, label }) => (
            <Chip
              key={value}
              active={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
              {value === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Chip>
          ))}
        </ChipRail>

        {unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={markAllAsRead}
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </Button>
        ) : null}
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : (
        <NotificationList
          notifications={visible}
          onOpen={(notification) => {
            if (!notification.is_read) markAsRead(notification.id)
          }}
        />
      )}
    </div>
  )
}
