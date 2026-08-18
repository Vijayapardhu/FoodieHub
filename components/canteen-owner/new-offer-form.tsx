"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StickyBar, StickyBarSpacer } from "@/components/ui/sticky-bar"
import { cn } from "@/lib/utils/cn"

interface NewOfferFormProps {
  canteenId: string
}

type DiscountType = "percentage" | "flat"

interface FieldErrors {
  title?: string
  discountValue?: string
  dates?: string
}

/** Defaults to a week-long promo starting now, the common case. */
function defaultRange() {
  const now = new Date()
  const until = new Date(now)
  until.setDate(until.getDate() + 7)
  return {
    from: format(now, "yyyy-MM-dd'T'HH:mm"),
    until: format(until, "yyyy-MM-dd'T'HH:mm"),
  }
}

export function NewOfferForm({ canteenId }: NewOfferFormProps) {
  const router = useRouter()
  const range = defaultRange()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [discountType, setDiscountType] = useState<DiscountType>("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [minOrderAmount, setMinOrderAmount] = useState("")
  const [maxDiscount, setMaxDiscount] = useState("")
  const [validFrom, setValidFrom] = useState(range.from)
  const [validUntil, setValidUntil] = useState(range.until)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const validate = () => {
    const next: FieldErrors = {}
    if (!title.trim()) next.title = "Give the offer a name"

    const value = Number(discountValue)
    if (!discountValue || value <= 0) {
      next.discountValue = "Enter a discount above zero"
    } else if (discountType === "percentage" && value > 100) {
      next.discountValue = "A percentage can't exceed 100"
    }

    if (!validFrom || !validUntil) {
      next.dates = "Set both start and end times"
    } else if (new Date(validUntil) <= new Date(validFrom)) {
      next.dates = "The end time must be after the start"
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
      const { error } = await supabase.from("offers").insert({
        canteen_id: canteenId,
        title: title.trim(),
        description: description.trim() || null,
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
        max_discount:
          discountType === "percentage" && maxDiscount
            ? Number(maxDiscount)
            : null,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil).toISOString(),
        is_active: true,
        is_approved: false,
      })

      if (error) throw error

      toast.success("Offer submitted for admin approval")
      router.push("/canteen/offers")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not create that offer")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="offer-title">
            Offer name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="offer-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Monsoon Munchies"
            invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "offer-title-error" : undefined}
          />
          {errors.title ? (
            <p
              id="offer-title-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.title}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="offer-description">Description</Label>
          <Textarea
            id="offer-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What the offer covers and any conditions"
            rows={3}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Discount</h2>

        <div className="grid grid-cols-2 gap-2">
          {(["percentage", "flat"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDiscountType(type)}
              aria-pressed={discountType === type}
              className={cn(
                "min-h-touch rounded-xl border px-4 text-sm font-semibold transition-colors",
                discountType === type
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground"
              )}
            >
              {type === "percentage" ? "Percentage (%)" : "Flat (₹)"}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="offer-value">
            {discountType === "percentage"
              ? "Percentage off"
              : "Amount off (₹)"}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="offer-value"
            type="number"
            inputMode="decimal"
            min="0"
            max={discountType === "percentage" ? 100 : undefined}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder={discountType === "percentage" ? "20" : "50"}
            invalid={Boolean(errors.discountValue)}
            aria-describedby={
              errors.discountValue ? "offer-value-error" : undefined
            }
          />
          {errors.discountValue ? (
            <p
              id="offer-value-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.discountValue}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="offer-min">Minimum order (₹)</Label>
            <Input
              id="offer-min"
              type="number"
              inputMode="decimal"
              min="0"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="Optional"
            />
          </div>

          {discountType === "percentage" ? (
            <div className="space-y-1.5">
              <Label htmlFor="offer-cap">Maximum discount (₹)</Label>
              <Input
                id="offer-cap"
                type="number"
                inputMode="decimal"
                min="0"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="Optional cap"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Runs from</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="offer-from">Start</Label>
            <Input
              id="offer-from"
              type="datetime-local"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              invalid={Boolean(errors.dates)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="offer-until">End</Label>
            <Input
              id="offer-until"
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              invalid={Boolean(errors.dates)}
            />
          </div>
        </div>

        {errors.dates ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.dates}
          </p>
        ) : null}

        <p className="rounded-xl bg-info-soft p-3 text-sm text-info">
          New offers need admin approval before students can use them.
        </p>
      </section>

      <StickyBarSpacer className="lg:hidden" />
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
            Create offer
          </Button>
        </div>
      </StickyBar>
    </form>
  )
}
