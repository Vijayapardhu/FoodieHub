"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, IndianRupee, Save, Truck } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "@/components/ui/image-upload"
import { SwitchRow, Switch } from "@/components/ui/switch"
import { StickyBar, StickyBarSpacer } from "@/components/ui/sticky-bar"
import { PushOptIn } from "@/components/notifications/push-opt-in"
import {
  DAY_KEYS,
  DAY_LABELS,
  type DayKey,
  type OperatingHours,
  parseOperatingHours,
} from "@/lib/utils/operating-hours"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

interface CanteenSettingsProps {
  canteen: Canteen
  categories: Category[]
}

export function CanteenSettings({ canteen }: CanteenSettingsProps) {
  const router = useRouter()

  const [name, setName] = useState(canteen.name)
  const [description, setDescription] = useState(canteen.description ?? "")
  const [contactPhone, setContactPhone] = useState(canteen.contact_phone ?? "")
  const [address, setAddress] = useState(canteen.address ?? "")
  const [addressReference, setAddressReference] = useState(
    canteen.address_reference ?? ""
  )
  const [mapsUrl, setMapsUrl] = useState(canteen.google_maps_url ?? "")
  const [logoUrl, setLogoUrl] = useState(canteen.logo_url ?? "")
  const [bannerUrl, setBannerUrl] = useState(canteen.banner_url ?? "")
  const [isOpen, setIsOpen] = useState(canteen.is_open)
  const [deliveryEnabled, setDeliveryEnabled] = useState(canteen.delivery_enabled ?? false)
  const [deliveryFee, setDeliveryFee] = useState(
    canteen.delivery_fee ? String(canteen.delivery_fee) : ""
  )
  const supportsDelivery = canteen.delivery_enabled !== undefined
  const [prepMinutes, setPrepMinutes] = useState(
    canteen.prep_minutes ? String(canteen.prep_minutes) : ""
  )
  const [concurrent, setConcurrent] = useState(
    canteen.concurrent_orders ? String(canteen.concurrent_orders) : "3"
  )
  // Added by migration 026. Sending the column to a database that hasn't had
  // it applied would fail the whole save, so the field waits for the column.
  const supportsPrepMinutes = canteen.prep_minutes !== undefined
  const [hours, setHours] = useState<OperatingHours>(() =>
    parseOperatingHours(canteen.operating_hours)
  )
  const [saving, setSaving] = useState(false)

  const setDay = (day: DayKey, patch: Partial<OperatingHours[DayKey]>) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }))
  }

  /** Saves the owner setting the same window seven times over. */
  const copyMondayToAll = () => {
    setHours((prev) =>
      DAY_KEYS.reduce((acc, day) => {
        acc[day] = { ...prev.monday }
        return acc
      }, {} as OperatingHours)
    )
    toast.success("Monday's hours copied to every day")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!name.trim()) {
      toast.error("Your canteen needs a name")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("canteens")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          contact_phone: contactPhone.trim() || null,
          address: address.trim() || null,
          address_reference: addressReference.trim() || null,
          google_maps_url: mapsUrl.trim() || null,
          logo_url: logoUrl || null,
          banner_url: bannerUrl || null,
          is_open: isOpen,
          operating_hours: hours,
          ...(supportsDelivery
            ? {
                delivery_enabled: deliveryEnabled,
                delivery_fee: deliveryFee ? Number(deliveryFee) : 0,
              }
            : {}),
          ...(supportsPrepMinutes
            ? {
                prep_minutes: prepMinutes ? Number(prepMinutes) : null,
                concurrent_orders: Number(concurrent) || 3,
              }
            : {}),
        })
        .eq("id", canteen.id)

      if (error) throw error

      toast.success("Settings saved")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not save your settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!canteen.is_approved ? (
        <p className="rounded-2xl border border-warning/30 bg-warning-soft p-3.5 text-sm text-warning">
          Your canteen is awaiting admin approval. Students won&apos;t see it
          until it&apos;s approved, but you can set everything up now.
        </p>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Serving right now
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant={isOpen ? "success" : "muted"} size="sm">
              {isOpen ? "Open" : "Closed"}
            </Badge>
            <Switch
              checked={isOpen}
              onCheckedChange={setIsOpen}
              aria-label="Canteen is open"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          This overrides your schedule — use it to close early or open late.
        </p>
      </section>

      {supportsDelivery ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Truck className="h-4 w-4 text-primary" />
              Delivery
            </h2>
            <Switch
              checked={deliveryEnabled}
              onCheckedChange={setDeliveryEnabled}
              aria-label="Deliver orders"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Also needs the platform-wide delivery switch on, and at least one
            delivery block set up by an admin — this only opts your canteen in.
          </p>

          {deliveryEnabled ? (
            <div className="space-y-1.5">
              <Label htmlFor="canteen-delivery-fee">Delivery fee</Label>
              <Input
                id="canteen-delivery-fee"
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="0"
                startAdornment={<IndianRupee className="h-4 w-4" />}
              />
              <p className="text-xs text-muted-foreground">
                Charged on top of the bill for every delivery order, regardless of
                which block it's going to.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="canteen-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-description">Description</Label>
          <Textarea
            id="canteen-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What you're known for"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-phone">Contact phone</Label>
          <Input
            id="canteen-phone"
            type="tel"
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
          <p className="text-xs text-muted-foreground">
            Students tap this to call you about an active order.
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Imagery</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Logo</Label>
            <ImageUpload
              bucket="canteens"
              folder={`${canteen.id}/logo`}
              currentImageUrl={logoUrl}
              onUploadComplete={setLogoUrl}
              aspectRatio="logo"
              label="Add a logo"
            />
          </div>

          <div className="space-y-2">
            <Label>Banner</Label>
            <ImageUpload
              bucket="canteens"
              folder={`${canteen.id}/banner`}
              currentImageUrl={bannerUrl}
              onUploadComplete={setBannerUrl}
              aspectRatio="banner"
              label="Add a banner"
            />
          </div>
        </div>
      </section>

      <PushOptIn audience="owner" />

      {supportsPrepMinutes ? (
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Typical wait
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            What students are told when they order. You can still stretch an
            individual order from its detail screen.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-prep">Minutes to prepare an order</Label>
          <Input
            id="canteen-prep"
            type="number"
            inputMode="numeric"
            min={1}
            max={180}
            value={prepMinutes}
            onChange={(e) => setPrepMinutes(e.target.value)}
            placeholder="Platform default"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to use the platform default. An honest number beats an
            optimistic one — it is the promise the app makes on your behalf.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-concurrency">Orders cooked at once</Label>
          <Input
            id="canteen-concurrency"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            value={concurrent}
            onChange={(e) => setConcurrent(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            How many orders your kitchen can work on in parallel. Waiting times
            quoted to students grow with the queue based on this — set it too
            high and busy-period estimates become fiction.
          </p>
        </div>
      </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Location</h2>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-address">Address</Label>
          <Input
            id="canteen-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Block C, ground floor"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-landmark">Landmark</Label>
          <Input
            id="canteen-landmark"
            value={addressReference}
            onChange={(e) => setAddressReference(e.target.value)}
            placeholder="Opposite the library"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-maps">Google Maps link</Label>
          <Input
            id="canteen-maps"
            type="url"
            inputMode="url"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Opening hours
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyMondayToAll}
          >
            <Copy className="h-4 w-4" />
            Copy Monday
          </Button>
        </div>

        <ul className="divide-y divide-border">
          {DAY_KEYS.map((day) => {
            const value = hours[day]
            return (
              <li key={day} className="space-y-2 py-3">
                <SwitchRow
                  label={DAY_LABELS[day]}
                  description={value.closed ? "Closed all day" : undefined}
                  checked={!value.closed}
                  onCheckedChange={(open) => setDay(day, { closed: !open })}
                  className="py-0"
                />

                {!value.closed ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={value.open}
                      onChange={(e) => setDay(day, { open: e.target.value })}
                      aria-label={`${DAY_LABELS[day]} opening time`}
                      className="h-11"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={value.close}
                      onChange={(e) => setDay(day, { close: e.target.value })}
                      aria-label={`${DAY_LABELS[day]} closing time`}
                      className="h-11"
                    />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>

      <StickyBarSpacer className="md:hidden" />
      <StickyBar aboveTabBar context="console">
        <Button type="submit" size="lg" block loading={saving}>
          {saving ? null : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </StickyBar>
    </form>
  )
}
