"use client"

import { useState, useEffect } from "react"
import { BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { requestNotificationPermission } from "@/lib/utils/notifications"

export function PushOptIn() {
  const [permission, setPermission] = useState("default")
  const [isSupported, setIsSupported] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window === "undefined" || !("Notification" in window)) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)
    setPermission(Notification.permission)
  }, [])

  const handleClick = async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? "granted" : "denied")
  }

  if (!mounted || !isSupported || permission === "granted") {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 rounded-full border-primary text-primary hover:bg-primary/10"
      onClick={handleClick}
    >
      <BellRing className="h-4 w-4" />
      Enable alerts
    </Button>
  )
}

