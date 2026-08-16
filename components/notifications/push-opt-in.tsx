"use client"

import { useCallback, useEffect, useState } from "react"
import { BellOff, BellRing, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  getPushState,
  subscribeToPush,
  unsubscribeFromPush,
  type PushState,
} from "@/lib/utils/push"
import { cn } from "@/lib/utils/cn"

interface PushOptInProps {
  /**
   * Owners get different copy and a firmer nudge: for a kitchen this is the
   * difference between seeing an order and missing it, not a nicety.
   */
  audience?: "customer" | "owner"
  className?: string
}

const COPY = {
  customer: {
    title: "Order alerts",
    idle: "Get a ping the moment your food is ready to collect.",
    on: "You'll be notified when your order is ready, even with the app closed.",
  },
  owner: {
    title: "New order alerts",
    idle: "Be alerted the moment an order comes in — screen off, app closed, phone in your pocket.",
    on: "This device will ring for new orders, even with the app closed.",
  },
} as const

/**
 * Registers this device for web push.
 *
 * Rendered as a card in settings rather than an unprompted popup — browsers
 * penalise sites that ask on load, and a request with no context in front of
 * it gets dismissed.
 */
export function PushOptIn({
  audience = "customer",
  className,
}: PushOptInProps) {
  const [state, setState] = useState<PushState | "loading">("loading")
  const [working, setWorking] = useState(false)
  const copy = COPY[audience]

  const refresh = useCallback(async () => {
    setState(await getPushState())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (state === "unsupported") return null

  const enable = async () => {
    setWorking(true)
    try {
      const result = await subscribeToPush()
      setState(result.state)
      if (result.ok) {
        toast.success("This device is registered")
      } else if (result.state === "denied") {
        toast.error("Notifications are blocked in your browser settings")
      } else {
        toast.error(result.error ?? "Could not register this device")
      }
    } finally {
      setWorking(false)
    }
  }

  const disable = async () => {
    setWorking(true)
    try {
      const ok = await unsubscribeFromPush()
      toast[ok ? "success" : "error"](
        ok ? "Alerts off for this device" : "Could not turn alerts off"
      )
      await refresh()
    } finally {
      setWorking(false)
    }
  }

  const subscribed = state === "subscribed"
  const denied = state === "denied"

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4",
        // An owner who hasn't switched this on is a problem worth flagging.
        audience === "owner" && !subscribed && !denied
          ? "border-warning/40 bg-warning-soft"
          : "border-border bg-card",
        className
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          subscribed
            ? "bg-success-soft text-success"
            : denied
              ? "bg-muted text-muted-foreground"
              : "bg-primary-soft text-primary"
        )}
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : denied ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <BellRing className="h-4 w-4" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{copy.title}</p>
        <p className="text-xs text-muted-foreground">
          {state === "loading"
            ? "Checking this device…"
            : subscribed
              ? copy.on
              : denied
                ? "Blocked. Re-enable notifications for this site in your browser."
                : copy.idle}
        </p>
      </div>

      {state === "loading" || denied ? null : subscribed ? (
        <Button
          size="sm"
          variant="ghost"
          loading={working}
          onClick={disable}
          className="shrink-0"
        >
          Turn off
        </Button>
      ) : (
        <Button
          size="sm"
          loading={working}
          onClick={enable}
          className="shrink-0"
        >
          Enable
        </Button>
      )}
    </div>
  )
}
