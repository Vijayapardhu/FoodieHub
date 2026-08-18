"use client"

import { useCallback, useEffect, useState } from "react"
import { Bike } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { useEventCallback } from "@/lib/hooks/use-event-callback"
import { cn } from "@/lib/utils/cn"

type DeliveryBlock = Database["public"]["Tables"]["delivery_blocks"]["Row"]

export interface DeliverySelection {
  fulfillmentType: "pickup" | "delivery"
  blockId: string | null
  fee: number
}

interface DeliverySelectorProps {
  canteenId: string
  onChange: (selection: DeliverySelection) => void
}

/**
 * Self-contained like OffersSelector and OrderScheduling: it fetches
 * whatever it needs (is delivery even switched on, at what price, to which
 * blocks) and renders nothing at all if the answer is no — the checkout
 * shouldn't carry a placeholder for an option that isn't actually on offer.
 */
export function DeliverySelector({
  canteenId,
  onChange: onChangeProp,
}: DeliverySelectorProps) {
  const onChange = useEventCallback(onChangeProp)
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(false)
  const [fee, setFee] = useState(0)
  const [blocks, setBlocks] = useState<DeliveryBlock[]>([])
  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">("pickup")
  const [blockId, setBlockId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: settings }, { data: canteen }, { data: blockRows }] = await Promise.all([
        supabase
          .from("platform_settings")
          .select("delivery_enabled")
          .eq("id", true)
          .maybeSingle(),
        supabase
          .from("canteens")
          .select("delivery_enabled, delivery_fee")
          .eq("id", canteenId)
          .maybeSingle(),
        supabase
          .from("delivery_blocks")
          .select("*")
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),
      ])

      setAvailable(Boolean(settings?.delivery_enabled) && Boolean(canteen?.delivery_enabled))
      setFee(Number(canteen?.delivery_fee ?? 0))
      setBlocks(blockRows ?? [])
    } catch (error) {
      // Columns from migration 049 not applied yet, or some other hiccup —
      // either way, pickup-only is always a safe fallback.
      console.error("[delivery] fetch failed", error)
      setAvailable(false)
    } finally {
      setLoading(false)
    }
  }, [supabase, canteenId])

  useEffect(() => {
    load()
  }, [load])

  // A different canteen means a different delivery fee and block list —
  // don't carry a stale choice across the switch.
  useEffect(() => {
    setFulfillmentType("pickup")
    setBlockId(null)
  }, [canteenId])

  // Reports the tab as chosen even without a block yet — the parent is what
  // decides whether that's enough to place an order, not this component.
  // Silently falling back to "pickup" here would let someone tap Delivery,
  // never notice the block picker, and have the order go to the counter
  // instead of where they thought they'd asked for it to go.
  useEffect(() => {
    onChange({
      fulfillmentType,
      blockId: fulfillmentType === "delivery" ? blockId : null,
      fee: fulfillmentType === "delivery" ? fee : 0,
    })
  }, [fulfillmentType, blockId, fee, onChange])

  if (loading || !available || blocks.length === 0) return null

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">Collection</h2>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setFulfillmentType("pickup")}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
            fulfillmentType === "pickup"
              ? "border-primary bg-primary-soft text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          Pickup
        </button>
        <button
          type="button"
          onClick={() => setFulfillmentType("delivery")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
            fulfillmentType === "delivery"
              ? "border-primary bg-primary-soft text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <Bike className="h-4 w-4" />
          Delivery{fee > 0 ? ` · ₹${fee.toFixed(0)}` : ""}
        </button>
      </div>

      {fulfillmentType === "delivery" ? (
        <div className="space-y-1.5">
          <label htmlFor="delivery-block" className="text-sm font-medium text-foreground">
            Deliver to
          </label>
          <select
            id="delivery-block"
            value={blockId ?? ""}
            onChange={(e) => setBlockId(e.target.value || null)}
            className={cn(
              "h-12 w-full rounded-xl border border-input bg-surface px-3.5 text-base text-foreground",
              "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            )}
          >
            <option value="">Choose a block</option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>
          {!blockId ? (
            <p className="flex items-center gap-1 text-xs text-warning">
              Pick a block to add ₹{fee.toFixed(0)} delivery to your bill
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
