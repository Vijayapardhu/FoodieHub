"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, TicketPercent } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { calculateDiscount, findBestOffer } from "@/lib/utils/offers"
import { useEventCallback } from "@/lib/hooks/use-event-callback"
import { cn } from "@/lib/utils/cn"

type Offer = Database["public"]["Tables"]["offers"]["Row"]

interface OffersSelectorProps {
  canteenId: string
  orderAmount: number
  onOfferSelected: (offer: Offer | null, discount: number) => void
}

export function OffersSelector({
  canteenId,
  orderAmount,
  onOfferSelected: onOfferSelectedProp,
}: OffersSelectorProps) {
  const onOfferSelected = useEventCallback(onOfferSelectedProp)
  const [offers, setOffers] = useState<Offer[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoApplied, setAutoApplied] = useState(false)
  const [supabase] = useState(() => createClient())

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("canteen_id", canteenId)
        .eq("is_active", true)
        .eq("is_approved", true)
        .lte("valid_from", now)
        .gte("valid_until", now)
        .order("discount_value", { ascending: false })

      if (error) throw error
      setOffers(data ?? [])
    } catch (error) {
      console.error("[offers] fetch failed", error)
    } finally {
      setLoading(false)
    }
  }, [supabase, canteenId])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  // Apply the best offer once, then leave the choice to the customer. Re-running
  // on every amount change would silently undo a manual selection.
  useEffect(() => {
    if (autoApplied || offers.length === 0 || orderAmount <= 0) return
    const best = findBestOffer(offers, orderAmount)
    setAutoApplied(true)
    if (best) {
      setSelectedId(best.offer.id)
      onOfferSelected(best.offer, best.discount)
    }
  }, [offers, orderAmount, autoApplied, onOfferSelected])

  const select = (offer: Offer) => {
    if (selectedId === offer.id) {
      setSelectedId(null)
      onOfferSelected(null, 0)
      return
    }
    setSelectedId(offer.id)
    onOfferSelected(offer, calculateDiscount(offer, orderAmount))
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    )
  }

  const usable = offers.filter(
    (offer) => calculateDiscount(offer, orderAmount) > 0
  )
  const locked = offers.filter(
    (offer) => calculateDiscount(offer, orderAmount) === 0
  )

  if (offers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No offers running at this canteen right now.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {usable.map((offer) => {
        const discount = calculateDiscount(offer, orderAmount)
        const active = selectedId === offer.id

        return (
          <button
            key={offer.id}
            type="button"
            onClick={() => select(offer)}
            aria-pressed={active}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors active:scale-[0.99]",
              active
                ? "border-primary bg-primary-soft"
                : "border-border bg-surface"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {active ? (
                <Check className="h-4 w-4" />
              ) : (
                <TicketPercent className="h-4 w-4" />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {offer.title}
              </span>
              {offer.description ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {offer.description}
                </span>
              ) : null}
            </span>

            <span className="shrink-0 text-sm font-bold text-success tabular-nums">
              −₹{discount.toFixed(0)}
            </span>
          </button>
        )
      })}

      {locked.map((offer) => (
        <div
          key={offer.id}
          className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3 opacity-70"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <TicketPercent className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">
              {offer.title}
            </span>
            <span className="block text-xs text-muted-foreground">
              {offer.min_order_amount
                ? `Add ₹${Math.max(
                    0,
                    offer.min_order_amount - orderAmount
                  ).toFixed(0)} more to unlock`
                : "Not applicable to this order"}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
