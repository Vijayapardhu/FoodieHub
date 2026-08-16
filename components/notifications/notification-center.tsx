"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck } from "@/components/ui/icons"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { NotificationList } from "@/components/notifications/notification-list"
import { useNotifications } from "@/lib/hooks/use-notifications"
import { cn } from "@/lib/utils/cn"

/** Bell + unread dot for the app bar. Opens the notification sheet. */
export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const { unreadCount } = useNotifications()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted active:scale-95",
          className
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      <NotificationSheet open={open} onOpenChange={setOpen} />
    </>
  )
}

export function NotificationSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80dvh]">
        <SheetHeader className="flex-row items-center justify-between gap-3 pr-12">
          <SheetTitle>Notifications</SheetTitle>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : null}
        </SheetHeader>

        <SheetBody className="space-y-3 pb-6">
          <NotificationList
            notifications={notifications.slice(0, 12)}
            onOpen={(notification) => {
              if (!notification.is_read) markAsRead(notification.id)
              onOpenChange(false)
            }}
            compact
          />

          {notifications.length > 0 ? (
            <Link
              href="/notifications"
              onClick={() => onOpenChange(false)}
              className="block rounded-xl border border-border py-3 text-center text-sm font-semibold text-primary"
            >
              See all notifications
            </Link>
          ) : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

/** Kept for existing call sites that render the whole bell + sheet unit. */
export function NotificationCenter() {
  return <NotificationBell />
}
