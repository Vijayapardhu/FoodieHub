"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { Database } from "@/types/database.types"

type NotificationWithUser =
  Database["public"]["Tables"]["notifications"]["Row"] & {
    users?: { full_name: string | null; email: string | null } | null
  }

interface AdminNotificationComposerProps {
  recentNotifications: NotificationWithUser[]
}

const audienceOptions = [
  { value: "all", label: "All users" },
  { value: "students", label: "Students" },
  { value: "canteen_owner", label: "Canteen owners" },
  { value: "single", label: "Specific email" },
]

export function AdminNotificationComposer({
  recentNotifications,
}: AdminNotificationComposerProps) {
  const router = useRouter()
  const [audience, setAudience] = useState("all")
  const [email, setEmail] = useState("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required")
      return
    }
    if (audience === "single" && !email.trim()) {
      toast.error("Provide an email to target")
      return
    }
    try {
      setLoading(true)
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          email: email.trim() || undefined,
          title: title.trim(),
          message: message.trim(),
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to send notification")
      }

      toast.success("Notification sent")
      setMessage("")
      setTitle("")
      setEmail("")
      setAudience("all")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to send notification")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {audienceOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setAudience(option.value)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                    audience === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 bg-white"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {audience === "single" && (
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
            <Input
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              rows={4}
              placeholder="Write a concise message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="rounded-full px-6"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send notification"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent notifications</h2>
        {recentNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No notifications sent yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((notification) => (
              <Card key={notification.id} className="border border-slate-100">
                <CardContent className="space-y-1 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      {notification.users?.full_name ||
                        notification.users?.email ||
                        "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

