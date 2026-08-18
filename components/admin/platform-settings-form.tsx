"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { History, Save } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SwitchRow } from "@/components/ui/switch"
import { EmptyState } from "@/components/ui/empty-state"
import { StickyBar } from "@/components/ui/sticky-bar"
import {
  PlatformSettings,
  settingLabel,
} from "@/lib/utils/platform-settings"

type AuditEntry = Database["public"]["Tables"]["settings_audit_log"]["Row"] & {
  users?: { full_name: string | null; email: string } | null
}

interface PlatformSettingsFormProps {
  settings: PlatformSettings
  auditLog: AuditEntry[]
  /** False when migration 019 hasn't been applied yet. */
  persisted: boolean
}

export function PlatformSettingsForm({
  settings: initial,
  auditLog,
  persisted,
}: PlatformSettingsFormProps) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  // The banner rate arrived with migration 023. Sending the column to a
  // database that hasn't had it applied would fail the whole save, so the
  // field only appears once the row actually carries it.
  const supportsPromoRate = initial.promo_daily_rate !== undefined
  const supportsDelivery = initial.delivery_enabled !== undefined

  const set = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.platform_name.trim()) {
      toast.error("The platform needs a name")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("platform_settings")
        .update({
          platform_name: form.platform_name.trim(),
          support_email: form.support_email?.trim() || null,
          support_phone: form.support_phone?.trim() || null,
          token_length: form.token_length,
          order_cancellation_window_minutes:
            form.order_cancellation_window_minutes,
          default_preparation_minutes: form.default_preparation_minutes,
          max_scheduled_days_ahead: form.max_scheduled_days_ahead,
          ordering_enabled: form.ordering_enabled,
          scheduled_orders_enabled: form.scheduled_orders_enabled,
          reviews_enabled: form.reviews_enabled,
          new_canteens_require_approval: form.new_canteens_require_approval,
          maintenance_message: form.maintenance_message?.trim() || null,
          ...(supportsPromoRate
            ? { promo_daily_rate: form.promo_daily_rate }
            : {}),
          ...(supportsDelivery
            ? { delivery_enabled: form.delivery_enabled }
            : {}),
          updated_by: user?.id ?? null,
        })
        .eq("id", true)

      if (error) throw error

      toast.success("Platform settings saved")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not save the settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!persisted ? (
        <p className="rounded-2xl border border-warning/30 bg-warning-soft p-3.5 text-sm text-warning">
          These are the built-in defaults. Apply migration{" "}
          <code className="font-mono">019_platform_settings.sql</code> to make
          them editable and persistent.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="platform-name">
              Platform name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="platform-name"
              value={form.platform_name}
              onChange={(e) => set("platform_name", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="support-email">Support email</Label>
              <Input
                id="support-email"
                type="email"
                inputMode="email"
                value={form.support_email ?? ""}
                onChange={(e) => set("support_email", e.target.value)}
                placeholder="help@college.edu"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support-phone">Support phone</Label>
              <Input
                id="support-phone"
                type="tel"
                inputMode="tel"
                value={form.support_phone ?? ""}
                onChange={(e) => set("support_phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ordering rules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="token-length">Token length</Label>
            <Input
              id="token-length"
              type="number"
              inputMode="numeric"
              min={4}
              max={8}
              value={form.token_length}
              onChange={(e) => set("token_length", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Characters in a pickup token (4–8).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cancel-window">Cancellation window</Label>
            <Input
              id="cancel-window"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              value={form.order_cancellation_window_minutes}
              onChange={(e) =>
                set(
                  "order_cancellation_window_minutes",
                  Number(e.target.value)
                )
              }
            />
            <p className="text-xs text-muted-foreground">
              Minutes a student can still cancel after ordering.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prep-time">Default prep time</Label>
            <Input
              id="prep-time"
              type="number"
              inputMode="numeric"
              min={1}
              max={180}
              value={form.default_preparation_minutes}
              onChange={(e) =>
                set("default_preparation_minutes", Number(e.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              Minutes quoted when a canteen hasn&apos;t set its own.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="schedule-horizon">Scheduling horizon</Label>
            <Input
              id="schedule-horizon"
              type="number"
              inputMode="numeric"
              min={0}
              max={30}
              value={form.max_scheduled_days_ahead}
              onChange={(e) =>
                set("max_scheduled_days_ahead", Number(e.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              How many days ahead an order can be scheduled.
            </p>
          </div>

          {supportsPromoRate ? (
            <div className="space-y-1.5">
              <Label htmlFor="promo-rate">Home banner rate</Label>
              <Input
                id="promo-rate"
                type="number"
                inputMode="decimal"
                min={0}
                step={10}
                value={form.promo_daily_rate}
                onChange={(e) => set("promo_daily_rate", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                ₹ a canteen pays per day for a slot in the home carousel.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <SwitchRow
            label="Ordering"
            description="Turn off to stop all new orders platform-wide"
            checked={form.ordering_enabled}
            onCheckedChange={(value) => set("ordering_enabled", value)}
          />
          <SwitchRow
            label="Scheduled orders"
            description="Let students book a pickup time in advance"
            checked={form.scheduled_orders_enabled}
            onCheckedChange={(value) => set("scheduled_orders_enabled", value)}
          />
          <SwitchRow
            label="Reviews"
            description="Allow ratings and written feedback"
            checked={form.reviews_enabled}
            onCheckedChange={(value) => set("reviews_enabled", value)}
          />
          <SwitchRow
            label="Canteen approval required"
            description="New registrations stay hidden until an admin approves"
            checked={form.new_canteens_require_approval}
            onCheckedChange={(value) =>
              set("new_canteens_require_approval", value)
            }
          />
          {supportsDelivery ? (
            <SwitchRow
              label="Delivery"
              description="Platform-wide switch. A canteen still needs its own delivery toggle on, and at least one delivery block has to exist, before checkout offers it."
              checked={form.delivery_enabled}
              onCheckedChange={(value) => set("delivery_enabled", value)}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance banner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label htmlFor="maintenance" className="sr-only">
            Maintenance message
          </Label>
          <Textarea
            id="maintenance"
            rows={2}
            value={form.maintenance_message ?? ""}
            onChange={(e) => set("maintenance_message", e.target.value)}
            placeholder="Leave empty for no banner. e.g. Campus canteens are closed on 26 Jan."
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            Shown at the top of every screen while it has text.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <History className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Change history</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <EmptyState
              title="No changes recorded"
              description="Every settings edit is logged here with who made it."
              compact
            />
          ) : (
            <ul className="divide-y divide-border">
              {auditLog.map((entry) => {
                const changes = entry.changes as Record<
                  string,
                  { from: unknown; to: unknown }
                >
                return (
                  <li key={entry.id} className="space-y-1 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {entry.users?.full_name ||
                          entry.users?.email ||
                          "An admin"}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "d MMM, h:mm a")}
                      </span>
                    </div>
                    <ul className="space-y-0.5">
                      {Object.entries(changes ?? {}).map(([key, value]) => (
                        <li key={key} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {settingLabel(key)}
                          </span>
                          : {String(value?.from ?? "—")} →{" "}
                          {String(value?.to ?? "—")}
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <StickyBar aboveTabBar context="console">
        <Button
          type="submit"
          size="lg"
          block
          loading={saving}
          disabled={!persisted}
        >
          {saving ? null : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </StickyBar>
    </form>
  )
}
