"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, TriangleAlert } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { useCartStore, type CartItem } from "@/store/cart-store"
import { useCheckoutDraftStore } from "@/store/checkout-draft"
import { useCartValidation } from "@/lib/hooks/use-cart-validation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { StickyBar } from "@/components/ui/sticky-bar"
import { payForOrder } from "@/lib/payments/razorpay-client"

/**
 * The stop between "here's what I built" (the cart) and "this is now
 * cooking" (an order placed with a canteen, possibly charged) — the actual
 * items and the actual bill, one more time, before anything is written or
 * charged. The cart page only *chooses*; this page is the one that submits.
 */
export function OrderConfirmation() {
  const router = useRouter()
  const draft = useCheckoutDraftStore((state) => state.draft)
  const clearDraft = useCheckoutDraftStore((state) => state.clearDraft)
  const items = useCartStore((state) => state.items)
  const [supabase] = useState(() => createClient())
  const [placing, setPlacing] = useState(false)

  // Reached directly (a refresh, a bookmarked link) rather than via "Review
  // order" — there's no draft to confirm, so send them back to make one.
  //
  // Guarded on `placing`: handleConfirm clears the draft the instant the
  // order rows are written, before the online-payment round trip even
  // starts, so this effect would otherwise fire mid-submission — bouncing
  // back to an empty cart before the Razorpay popup ever had a chance to
  // open, on every single online-payment order.
  useEffect(() => {
    if (!draft && !placing) {
      toast.error("Review your order again before confirming")
      router.replace("/cart")
    }
  }, [draft, placing, router])

  const cartItems = useMemo(() => {
    if (!draft) return []
    return draft.canteenId
      ? items.filter((i) => i.canteenId === draft.canteenId)
      : items
  }, [items, draft])

  // The one check that matters most right here: nothing sold out, no canteen
  // shut, no price moved, in the gap between reviewing and confirming.
  const validation = useCartValidation(cartItems)

  const orderable = useMemo(
    () => cartItems.filter((i) => !validation.unavailableIds.has(i.itemId)),
    [cartItems, validation.unavailableIds]
  )

  const groups = useMemo(() => {
    const map = new Map<string, CartItem[]>()
    for (const item of orderable) {
      const list = map.get(item.canteenId) ?? []
      list.push(item)
      map.set(item.canteenId, list)
    }
    return Array.from(map, ([canteenId, groupItems]) => ({ canteenId, items: groupItems }))
  }, [orderable])

  const sum = (list: CartItem[]) => list.reduce((total, item) => total + item.price * item.quantity, 0)
  const subtotal = sum(orderable)
  const appliedDiscount = draft?.discount ?? 0
  const deliveryFee = draft?.deliveryFee ?? 0
  const total = Math.max(0, subtotal - appliedDiscount) + deliveryFee

  const orderGroups = groups.map((group) => ({
    canteenId: group.canteenId,
    canteenName: group.items[0]?.canteenName ?? "Canteen",
    count: group.items.reduce((n, item) => n + item.quantity, 0),
    total: sum(group.items),
  }))
  const splitOrder = orderGroups.length > 1

  // Same rule as the cart: a closed canteen only blocks confirming if no
  // collection time was already chosen back there — that choice travelled
  // here in the draft.
  const closedNames = orderGroups
    .filter((group) => validation.closedIds.has(group.canteenId))
    .map((group) => group.canteenName)
  const needsSchedule = closedNames.length > 0 && !draft?.scheduledPickupTime
  const blocked =
    !draft || cartItems.length === 0 || validation.unavailableIds.size > 0 || needsSchedule

  const handleConfirm = async () => {
    if (!draft || blocked) {
      toast.error("Something changed since you reviewed this — check your cart")
      return
    }

    setPlacing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please log in again")
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("users")
        .select("full_name, phone_number")
        .eq("id", user.id)
        .maybeSingle()

      const customerName =
        profile?.full_name ||
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email ||
        null

      // One order per canteen, and each one stands alone — a failure at one
      // canteen must not take down the other. See cart-summary's history for
      // why this loop never throws out on the first error.
      const placed: Array<{ canteenName: string; token: string; orderId: string }> = []
      const failed: Array<{ canteenName: string; reason: string }> = []

      for (const group of groups) {
        if (group.items.length === 0) continue

        const canteenName = group.items[0]?.canteenName ?? "that canteen"

        try {
          const groupSubtotal = sum(group.items)
          const groupTotal =
            (draft.canteenId && group.canteenId === draft.canteenId
              ? Math.max(0, groupSubtotal - appliedDiscount)
              : groupSubtotal) + deliveryFee

          const delivering = draft.fulfillmentType === "delivery" && draft.deliveryBlockId

          const orderData: Record<string, unknown> = {
            user_id: user.id,
            canteen_id: group.canteenId,
            status: "pending",
            // The database recomputes this from the lines, re-derives the
            // discount from the offer, and re-prices delivery from the
            // canteen's current rate — this is only a starting value.
            total_amount: groupTotal,
            offer_id: draft.offerId && group.canteenId === draft.canteenId ? draft.offerId : null,
            payment_method: draft.paymentMethod,
            payment_status: "pending",
            customer_name: customerName,
            customer_phone: profile?.phone_number || null,
            order_type: draft.scheduledPickupTime ? "scheduled" : "immediate",
            special_instructions: draft.specialInstructions || null,
            dietary_notes: draft.dietaryNotes || null,
            fulfillment_type: delivering ? "delivery" : "pickup",
            delivery_block_id: delivering ? draft.deliveryBlockId : null,
            delivery_fee: delivering ? draft.deliveryFee : 0,
          }

          if (draft.scheduledPickupTime) {
            orderData.scheduled_pickup_time = draft.scheduledPickupTime
            orderData.preferred_time_slot = draft.preferredTimeSlot
          }

          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert(orderData as any)
            .select()
            .single()

          if (orderError) throw orderError

          const { error: itemsError } = await supabase.from("order_items").insert(
            group.items.map((item) => ({
              order_id: order.id,
              item_id: item.itemId,
              quantity: item.quantity,
              price: item.price,
            }))
          )

          if (itemsError) {
            await supabase.from("orders").delete().eq("id", order.id)
            throw itemsError
          }

          placed.push({ canteenName, token: order.token ?? order.id, orderId: order.id })

          group.items.forEach((item) => {
            useCartStore.getState().removeItem(item.itemId)
          })
        } catch (groupError: any) {
          failed.push({
            canteenName,
            reason: groupError?.message || "could not be placed",
          })
        }
      }

      if (placed.length === 0) {
        toast.error(failed[0]?.reason || "Could not create your order. Please try again.")
        return
      }

      clearDraft()

      // The cart page forces "on_shop" the moment a cart splits across
      // canteens, so online payment only ever gets here with exactly one
      // order to collect for.
      if (draft.paymentMethod === "online" && failed.length === 0) {
        try {
          await payForOrder({
            orderId: placed[0].orderId,
            canteenName: placed[0].canteenName,
            prefill: {
              name: customerName,
              email: user.email ?? null,
              contact: profile?.phone_number ?? null,
            },
          })
          toast.success("Order placed & paid")
        } catch {
          toast(
            "Order placed — payment didn't go through. You can pay again from the order page.",
            { icon: "⚠️", duration: 6000 }
          )
        }
        router.push(`/orders/${placed[0].token}`)
        return
      }

      if (failed.length > 0) {
        toast.success(
          `${placed.length} order${placed.length === 1 ? "" : "s"} placed · ${failed
            .map((f) => f.canteenName)
            .join(", ")} did not go through`,
          { duration: 6000 }
        )
      } else {
        toast.success(
          placed.length === 1
            ? "Order placed"
            : `${placed.length} orders placed — one token per canteen`
        )
      }

      router.push(placed.length === 1 ? `/orders/${placed[0].token}` : "/orders")
    } catch (error: any) {
      toast.error(error?.message || "Could not place your order")
    } finally {
      setPlacing(false)
    }
  }

  if (!draft) return null

  return (
    <>
      <div className="space-y-4">
        {validation.unavailableIds.size > 0 ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive-soft p-3.5 text-sm text-destructive">
            <p className="flex items-start gap-2 font-semibold">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Something changed since you reviewed this
            </p>
            <p className="mt-1 pl-6 text-xs text-destructive/90">
              {validation.unavailableIds.size === 1 ? "An item has" : "Some items have"} sold out.
              Go back to your cart to fix it before confirming.
            </p>
          </div>
        ) : null}

        {orderGroups.map((group) => {
          const groupItems = groups.find((g) => g.canteenId === group.canteenId)?.items ?? []
          return (
            <section
              key={group.canteenId}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
                {group.canteenName}
              </h2>
              <ul className="divide-y divide-border px-4">
                {groupItems.map((item) => (
                  <li
                    key={item.itemId}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 text-foreground">
                      <span className="font-semibold tabular-nums">{item.quantity}×</span>{" "}
                      {item.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-foreground">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Bill</h2>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Item total</dt>
              <dd className="tabular-nums text-foreground">₹{subtotal.toFixed(2)}</dd>
            </div>

            {appliedDiscount > 0 ? (
              <div className="flex justify-between text-success">
                <dt className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {draft.offerTitle ?? "Discount"}
                </dt>
                <dd className="tabular-nums">−₹{appliedDiscount.toFixed(2)}</dd>
              </div>
            ) : null}

            {deliveryFee > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery fee</dt>
                <dd className="tabular-nums text-foreground">₹{deliveryFee.toFixed(2)}</dd>
              </div>
            ) : null}

            {!splitOrder ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Collection</dt>
                <dd className="text-foreground">
                  {draft.fulfillmentType === "delivery" ? "Delivery" : "Pickup"}
                </dd>
              </div>
            ) : null}

            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="text-foreground">
                {splitOrder
                  ? "Pay at each counter"
                  : draft.paymentMethod === "online"
                    ? "Pay online now"
                    : draft.fulfillmentType === "delivery"
                      ? "Pay on delivery"
                      : "Pay at the counter"}
              </dd>
            </div>

            {draft.scheduledPickupTime ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Collect at</dt>
                <dd className="text-foreground">
                  {new Date(draft.scheduledPickupTime).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            ) : null}

            <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold">
              <dt>{splitOrder ? `Across ${orderGroups.length} orders` : "Total"}</dt>
              <dd className="tabular-nums">₹{total.toFixed(2)}</dd>
            </div>
          </dl>

          {splitOrder ? (
            <p className="rounded-xl bg-info-soft px-3 py-2 text-xs text-info">
              This is {orderGroups.length} separate orders with {orderGroups.length} pickup tokens —
              one per canteen.
            </p>
          ) : null}
        </div>
      </div>

      <StickyBar>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/cart")}
            disabled={placing}
          >
            Edit
          </Button>
          <Button
            size="lg"
            className="flex-1 justify-between"
            loading={placing}
            disabled={blocked || validation.checking}
            onClick={handleConfirm}
          >
            <span className="tabular-nums">₹{total.toFixed(2)}</span>
            <span>
              {placing
                ? "Placing…"
                : validation.checking
                  ? "Checking…"
                  : splitOrder
                    ? `Confirm ${orderGroups.length} orders`
                    : "Confirm order"}
            </span>
          </Button>
        </div>
      </StickyBar>
    </>
  )
}
