"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { BellRing, Send } from "lucide-react"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils/cn"

type NotificationWithUser =
  Database["public"]["Tables"]["notifications"]["Row"] & {
    users?: { full_name: string | null; email: string | null } | null
  }

const audiences = [
  { value: "all", label: "Everyone", hint: "All registered accounts" },
  { value: "students", label: "Students", hint: "Customer accounts only" },
  { value: "canteen_owner", label: "Canteen owners", hint: "Kitchen staff" },
  { value: "single", label: "One person", hint: "By email address" },
] as const

export function AdminNotificationComposer({
  recentNotifications,
}: {
  recentNotifications: NotificationWithUser[]
}) {
  const router = useRouter()
  const [audience, setAudience] = useState<string>("all")
  const [email, setEmail] = useState("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!title.trim() || !message.trim()) {
      toast.error("A title and message are both required")
      return
    }
    if (audience === "single" && !email.trim()) {
      toast.error("Enter the recipient's email")
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          email: email.trim() || undefined,
          title: title.trim(),
          message: message.trim(),
        }),
      })

      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || "Could not send that notification")
      }

      toast.success("Notification sent")
      setTitle("")
      setMessage("")
      setEmail("")
      setAudience("all")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not send that notification")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <fieldset>
              <legend className="muted-label mb-2">Send to</legend>
              <div className="grid grid-cols-2 gap-2">
                {audiences.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAudience(option.value)}
                    aria-pressed={audience === option.value}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      audience === option.value
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-surface"
                    )}
                  >
                    <span
                      className={cn(
                        "block text-sm font-semibold",
                        audience === option.value
                          ? "text-primary"
                          : "text-foreground"
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {audience === "single" ? (
              <div className="space-y-1.5">
                <Label htmlFor="notify-email">Recipient email</Label>
                <Input
                  id="notify-email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="notify-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="notify-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Canteens closed on Friday"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notify-message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="notify-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Keep it short — it appears as a push notification."
                maxLength={500}
              />
              <p className="text-right text-xs text-muted-foreground tabular-nums">
                {message.length}/500
              </p>
            </div>

            <Button type="submit" size="lg" block loading={sending}>
              {sending ? null : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : "Send notification"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently sent</CardTitle>
        </CardHeader>

        <CardContent>
          {recentNotifications.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="Nothing sent yet"
              description="Announcements you broadcast show up here."
              compact
            />
          ) : (
            <ul className="divide-y divide-border">
              {recentNotifications.map((notification) => (
                <li key={notification.id} className="space-y-1 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {notification.title}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(
                        new Date(notification.created_at),
                        "d MMM, h:mm a"
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    To{" "}
                    {notification.users?.full_name ||
                      notification.users?.email ||
                      "a user"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
