"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Megaphone } from "lucide-react"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { StickyBar } from "@/components/ui/sticky-bar"
import {
  PROMO_PLACEMENTS,
  formatRupees,
  placementMeta,
  slotCost,
  slotDays,
  type PromoPlacement,
} from "@/lib/utils/promo-banners"
import { cn } from "@/lib/utils/cn"

export interface BookableOffer {
  id: string
  title: string
  discount_type: "percentage" | "flat"
  discount_value: number
  valid_until: string
}

interface PromoBannerFormProps {
  canteenId: string
  canteenName: string
  offers: BookableOffer[]
  dailyRate: number
}

interface FieldErrors {
  headline?: string
  dates?: string
}

/** Runs from tomorrow for a week — long enough to be worth buying. */
function defaultRange() {
  const from = new Date()
  from.setDate(from.getDate() + 1)
  from.setHours(8, 0, 0, 0)
  const until = new Date(from)
  until.setDate(until.getDate() + 7)
  return {
    from: format(from, "yyyy-MM-dd'T'HH:mm"),
    until: format(until, "yyyy-MM-dd'T'HH:mm"),
  }
}

export function PromoBannerForm({
  canteenId,
  canteenName,
  offers,
  dailyRate,
}: PromoBannerFormProps) {
  const router = useRouter()
  const range = useMemo(defaultRange, [])

  const [headline, setHeadline] = useState("")
  const [subtext, setSubtext] = useState("")
  const [ctaLabel, setCtaLabel] = useState("Order now")
  const [imageUrl, setImageUrl] = useState("")
  const [offerId, setOfferId] = useState("")
  const [placement, setPlacement] = useState<PromoPlacement>("home_hero")
  const [startsAt, setStartsAt] = useState(range.from)
  const [endsAt, setEndsAt] = useState(range.until)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const days = slotDays(startsAt, endsAt)
  const cost = slotCost(startsAt, endsAt, dailyRate, placement)

  const validate = () => {
    const next: FieldErrors = {}
    if (!headline.trim()) next.headline = "Write the line students will read"

    if (!startsAt || !endsAt) {
      next.dates = "Set both a start and an end"
    } else if (new Date(endsAt) <= new Date(startsAt)) {
      next.dates = "The end must come after the start"
    } else if (new Date(endsAt).getTime() < Date.now()) {
      next.dates = "That window has already passed"
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) {
      toast.error("Check the highlighted fields")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("promo_banners").insert({
        canteen_id: canteenId,
        offer_id: offerId || null,
        placement,
        headline: headline.trim(),
        subtext: subtext.trim() || null,
        image_url: imageUrl || null,
        cta_label: ctaLabel.trim() || "Order now",
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        // Priced again in the database from the published rate; sent here so
        // the request records the figure the owner was shown.
        amount_due: cost,
        created_by: user?.id ?? null,
      })

      if (error) throw error

      toast.success("Slot requested — an admin will review it")
      router.push("/canteen/promotions")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not request that slot")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* What they're buying, before what they have to fill in. */}
      <section className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary-soft p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Megaphone className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">
            {placementMeta(placement).label}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {placementMeta(placement).description}{" "}
            {formatRupees(dailyRate * placementMeta(placement).multiplier)} per
            day, billed for the whole booked window.
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Where it runs
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The carousel gets the most eyes. The cheaper slots reach people who
            are already ordering.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {PROMO_PLACEMENTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPlacement(option.value)}
              aria-pressed={placement === option.value}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                placement === option.value
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface hover:bg-muted"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {option.label}
                </span>
                <span className="shrink-0 text-xs font-bold tabular-nums text-primary">
                  {formatRupees(dailyRate * option.multiplier)}/day
                </span>
              </span>
              <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">The banner</h2>

        <div className="space-y-1.5">
          <Label htmlFor="promo-headline">
            Headline <span className="text-destructive">*</span>
          </Label>
          <Input
            id="promo-headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value.slice(0, 60))}
            placeholder="e.g. Fresh dosas, all afternoon"
            invalid={Boolean(errors.headline)}
            aria-describedby={
              errors.headline ? "promo-headline-error" : "promo-headline-hint"
            }
          />
          {errors.headline ? (
            <p
              id="promo-headline-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.headline}
            </p>
          ) : (
            <p id="promo-headline-hint" className="text-xs text-muted-foreground">
              {60 - headline.length} characters left
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="promo-subtext">Supporting line</Label>
          <Textarea
            id="promo-subtext"
            rows={2}
            value={subtext}
            onChange={(e) => setSubtext(e.target.value.slice(0, 120))}
            placeholder="One short sentence — a time, a price or a reason"
          />
          <p className="text-xs text-muted-foreground">
            {120 - subtext.length} characters left
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="promo-cta">Button text</Label>
          <Input
            id="promo-cta"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value.slice(0, 24))}
            placeholder="Order now"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Artwork</Label>
          <ImageUpload
            bucket="promos"
            folder={canteenId}
            aspectRatio="banner"
            currentImageUrl={imageUrl || null}
            onUploadComplete={setImageUrl}
            label="Upload a wide photo"
          />
          <p className="text-xs text-muted-foreground">
            Roughly 3:1 works best. Keep the left half clear — the text sits
            there. Without one, your banner uses the FoodieHub gradient.
          </p>
        </div>
      </section>

      {offers.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Attach a discount
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Adds a badge to the banner. Optional.
            </p>
          </div>

          <select
            id="promo-offer"
            aria-label="Discount to advertise"
            value={offerId}
            onChange={(e) => setOfferId(e.target.value)}
            className={cn(
              "h-12 w-full rounded-xl border border-input bg-surface px-3.5 text-base text-foreground",
              "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            )}
          >
            <option value="">No discount</option>
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.title} ·{" "}
                {offer.discount_type === "percentage"
                  ? `${offer.discount_value}%`
                  : `₹${offer.discount_value}`}{" "}
                off
              </option>
            ))}
          </select>
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">When it runs</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="promo-start">Start</Label>
            <Input
              id="promo-start"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              invalid={Boolean(errors.dates)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promo-end">End</Label>
            <Input
              id="promo-end"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              invalid={Boolean(errors.dates)}
            />
          </div>
        </div>

        {errors.dates ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.dates}
          </p>
        ) : null}

        <dl className="space-y-1.5 rounded-xl bg-surface-muted p-3.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Days booked</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {days}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {placementMeta(placement).label}
            </dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {formatRupees(dailyRate * placementMeta(placement).multiplier)} /
              day
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <dt className="font-semibold text-foreground">Total</dt>
            <dd className="text-base font-extrabold tabular-nums text-primary">
              {formatRupees(cost)}
            </dd>
          </div>
        </dl>

        <p className="rounded-xl bg-info-soft p-3 text-sm text-info">
          Nothing is charged here. An admin reviews the banner, collects payment
          from {canteenName} directly, and then puts it live.
        </p>
      </section>

      <StickyBar aboveTabBar context="console">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" className="flex-1" loading={saving}>
            Request slot
          </Button>
        </div>
      </StickyBar>
    </form>
  )
}
