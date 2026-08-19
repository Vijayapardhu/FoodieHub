"use client"

import { useEffect, useState } from "react"
import { Save, Shield } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SwitchRow } from "@/components/ui/switch"

interface PaymentSettingsData {
  online_payments_enabled: boolean
  razorpay_key_id: string | null
  razorpay_key_secret_set: boolean
  razorpay_key_secret_preview: string | null
  razorpay_webhook_secret_set: boolean
  razorpay_webhook_secret_preview: string | null
}

/**
 * Self-contained like DeliverySelector: fetches its own data from
 * /api/admin/payment-settings rather than being handed a server-rendered
 * prop, because the credential fields (migration 055's payment_credentials
 * table) have no RLS policies at all — only the admin API route, running
 * with the service-role client, can read them.
 */
export function PaymentSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PaymentSettingsData | null>(null)
  const [enabled, setEnabled] = useState(true)
  const [keyId, setKeyId] = useState("")
  const [keySecret, setKeySecret] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/payment-settings")
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Could not load payment settings")
      const data = json.data as PaymentSettingsData
      setSettings(data)
      setEnabled(data.online_payments_enabled)
      setKeyId(data.razorpay_key_id ?? "")
    } catch (error: any) {
      toast.error(error?.message || "Could not load payment settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          online_payments_enabled: enabled,
          razorpay_key_id: keyId,
          razorpay_key_secret: keySecret,
          razorpay_webhook_secret: webhookSecret,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Could not save")

      toast.success("Payment settings saved")
      // Secrets never round-trip back into these fields — only their
      // masked preview does, via the reload below.
      setKeySecret("")
      setWebhookSecret("")
      await load()
    } catch (error: any) {
      toast.error(error?.message || "Could not save payment settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Loading payment settings…
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Online payments</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <SwitchRow
            label="Razorpay checkout"
            description={
              'Turn off to hide "Pay online" everywhere — checkout and banner payments both fall back to pay-at-counter / pay-on-delivery (banners simply can\'t be paid for until it\'s back on).'
            }
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Razorpay credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rzp-key-id">Key ID</Label>
            <Input
              id="rzp-key-id"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="rzp_test_… or rzp_live_…"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rzp-key-secret">Key secret</Label>
            <Input
              id="rzp-key-secret"
              type="password"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder={
                settings?.razorpay_key_secret_set
                  ? `Currently set, ends ${settings.razorpay_key_secret_preview}`
                  : "Not set"
              }
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">Leave blank to keep the current secret.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rzp-webhook-secret">Webhook secret</Label>
            <Input
              id="rzp-webhook-secret"
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={
                settings?.razorpay_webhook_secret_set
                  ? `Currently set, ends ${settings.razorpay_webhook_secret_preview}`
                  : "Not set — optional"
              }
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              From Razorpay Dashboard → Settings → Webhooks. Leave blank to keep the current one.
            </p>
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-info-soft px-3 py-2 text-xs text-info">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Saving a new Key ID or Secret tests it against Razorpay first — the save is rejected if
            Razorpay doesn&apos;t recognise the pair, so a typo can&apos;t silently break checkout.
          </p>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" loading={saving}>
        {saving ? null : <Save className="h-4 w-4" />}
        {saving ? "Saving…" : "Save payment settings"}
      </Button>
    </form>
  )
}
