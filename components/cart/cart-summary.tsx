"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BookmarkCheck, Clock, MessageSquare, Sparkles, TicketPercent } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { useCartStore } from "@/store/cart-store"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Disclosure } from "@/components/ui/disclosure"
import { StickyBar } from "@/components/ui/sticky-bar"
import { cn } from "@/lib/utils/cn"
import { OffersSelector } from "./offers-selector"
import { OrderScheduling } from "./order-scheduling"
import { OrderTemplates } from "./order-templates"
import { DietaryPreferences } from "./dietary-preferences"

type Offer = Database["public"]["Tables"]["offers"]["Row"]

interface CartSummaryProps {
  canteenId: string | null
  /** Lines the kitchen can no longer make; excluded from the bill entirely. */
  unavailableIds: Set<string>
  /** The first check against the kitchen hasn't finished yet. */
  checking: boolean
  closedIds: Set<string>
}

export function CartSummary({ canteenId, unavailableIds, checking, closedIds }: CartSummaryProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const items = useCartStore((state) => state.items)

  const [loading, setLoading] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [discount, setDiscount] = useState(0)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [scheduledPickupTime, setScheduledPickupTime] = useState<Date | null>(null)
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string | null>(null)
  const [dietaryNotes, setDietaryNotes] = useState("")

  // Sold-out lines are dropped here rather than at the point of insert, so
  // the bill on screen and the order sent to the kitchen are the same thing.
  const orderable = useMemo(
    () => items.filter((i) => !unavailableIds.has(i.itemId)),
    [items, unavailableIds]
  )

  const cartItems = useMemo(
    () => (canteenId ? orderable.filter((i) => i.canteenId === canteenId) : orderable),
    [orderable, canteenId]
  )

  const groups = useMemo(() => {
    if (canteenId) return [{ canteenId, items: cartItems }]

    const map = new Map<string, typeof items>()
    for (const item of orderable) {
      const list = map.get(item.canteenId) ?? []
      list.push(item)
      map.set(item.canteenId, list)
    }
    return Array.from(map, ([id, groupItems]) => ({
      canteenId: id,
      items: groupItems,
    }))
  }, [orderable, cartItems, canteenId])

  const sum = (list: typeof items) =>
    list.reduce((total, item) => total + item.price * item.quantity, 0)

  const subtotal = sum(cartItems)
  // Offers are per canteen, so they only apply when checking out one canteen.
  const appliedDiscount = canteenId ? discount : 0
  const total = Math.max(0, subtotal - appliedDiscount)
  const itemCount = cartItems.reduce((n, item) => n + item.quantity, 0)

  // What checkout will actually create. A cart across two counters is two
  // orders, and the bill has to say so before the tap rather than after.
  const orderGroups = useMemo(
    () =>
      groups
        .filter((group) => group.items.length > 0)
        .map((group) => ({
          canteenId: group.canteenId,
          canteenName: group.items[0]?.canteenName ?? "Canteen",
          count: group.items.reduce((n, item) => n + item.quantity, 0),
          total: sum(group.items),
        })),
    [groups]
  )
  const splitOrder = orderGroups.length > 1

  /*
   * A closed canteen stops an order it would have to cook now, and nothing
   * else — the database has always accepted a booking for later. So being
   * closed is an invitation to schedule rather than a wall, and only becomes
   * blocking if no pickup time has been chosen.
   */
  const closedNames = orderGroups
    .filter((group) => closedIds.has(group.canteenId))
    .map((group) => group.canteenName)
  const needsSchedule = closedNames.length > 0 && !scheduledPickupTime
  const cannotPlace = unavailableIds.size > 0 || needsSchedule

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    // The database guards reject these too, but being turned away after the
    // tap reads as a broken app rather than a closed kitchen.
    if (cannotPlace) {
      toast.error(
        needsSchedule
          ? "Pick a collection time — that canteen is closed right now"
          : "Remove the sold-out items first"
      )
      return
    }

    setLoading(true)
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

      /*
       * One order per canteen, and each one stands alone.
       *
       * A cart spanning two counters is two orders with two tokens, collected
       * separately and paid for separately — so a failure at one canteen must
       * not take down the other. The previous version threw out of the loop
       * on the first error, which left the first canteen's order created and
       * its lines already cleared from the cart while the student was told
       * the whole thing had failed. That is the one outcome worse than not
       * ordering: food being cooked that nobody knows about.
       */
      const placed: Array<{ canteenName: string; token: string }> = []
      const failed: Array<{ canteenName: string; reason: string }> = []

      for (const group of groups) {
        if (group.items.length === 0) continue

        const canteenName = group.items[0]?.canteenName ?? "that canteen"

        try {
          const groupSubtotal = sum(group.items)
          const groupTotal =
            canteenId && group.canteenId === canteenId
              ? Math.max(0, groupSubtotal - appliedDiscount)
              : groupSubtotal

          const orderData: Record<string, unknown> = {
            user_id: user.id,
            canteen_id: group.canteenId,
            // No token: the database picks one, retrying against the live
            // table until it is free. Generating it here raced with itself.
            status: "pending",
            // The database recomputes this from the lines and re-derives the
            // discount from the offer below, so this is only a starting value.
            total_amount: groupTotal,
            // Nominate the offer rather than asserting a discount: the server
            // decides whether it applies and for how much.
            offer_id: selectedOffer && group.canteenId === canteenId ? selectedOffer.id : null,
            payment_method: "on_shop",
            payment_status: "pending",
            customer_name: customerName,
            customer_phone: profile?.phone_number || null,
            order_type: scheduledPickupTime ? "scheduled" : "immediate",
            special_instructions: specialInstructions.trim() || null,
            dietary_notes: dietaryNotes.trim() || null,
          }

          // A collection time applies to every order in the checkout, not
          // only the one canteen in scope. The student is making one trip;
          // and if the time was chosen because a canteen is shut, scoping it
          // to a single group is exactly what would get that group rejected.
          if (scheduledPickupTime) {
            orderData.scheduled_pickup_time = scheduledPickupTime.toISOString()
            orderData.preferred_time_slot = preferredTimeSlot
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
            // An order with no lines is not an order. Remove it rather than
            // leave the kitchen a blank ticket.
            await supabase.from("orders").delete().eq("id", order.id)
            throw itemsError
          }

          // Keep the token, not the uuid: it is what the order is called by
          // at the counter.
          placed.push({ canteenName, token: order.token ?? order.id })

          // Only clear lines that actually made it into an order.
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

      if (failed.length > 0) {
        // Say exactly what happened to each, because the cart will still be
        // holding the lines that did not go through.
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
      setLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-3">
        {canteenId ? (
          <>
            <Disclosure
              title="Offers"
              icon={TicketPercent}
              summary={
                selectedOffer
                  ? `${selectedOffer.title} · saving ₹${discount.toFixed(0)}`
                  : "Check available discounts"
              }
            >
              <OffersSelector
                canteenId={canteenId}
                orderAmount={subtotal}
                onOfferSelected={(offer, discountAmount) => {
                  setSelectedOffer(offer)
                  setDiscount(discountAmount)
                }}
              />
            </Disclosure>

            <Disclosure
              title="Pickup time"
              icon={Clock}
              summary={
                scheduledPickupTime ? scheduledPickupTime.toLocaleString() : "As soon as it's ready"
              }
            >
              <OrderScheduling
                onScheduleChange={(scheduledTime, timeSlot) => {
                  setScheduledPickupTime(scheduledTime)
                  setPreferredTimeSlot(timeSlot)
                }}
              />
            </Disclosure>

            <Disclosure
              title="Saved orders"
              icon={BookmarkCheck}
              summary="Reload a usual order, or save this one"
            >
              <OrderTemplates canteenId={canteenId} />
            </Disclosure>
          </>
        ) : null}

        <Disclosure
          title="Notes for the kitchen"
          icon={MessageSquare}
          summary={
            specialInstructions.trim() || dietaryNotes.trim()
              ? "Notes added"
              : "Allergies, spice level, packing"
          }
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="special-instructions" className="text-sm font-medium text-foreground">
                Special instructions
              </label>
              <Textarea
                id="special-instructions"
                placeholder="e.g. less spicy, extra chutney, pack separately"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                maxLength={500}
              />
              <p className="text-right text-xs tabular-nums text-muted-foreground">
                {specialInstructions.length}/500
              </p>
            </div>

            <DietaryPreferences
              cartItems={cartItems.map((item) => ({
                itemId: item.itemId,
                name: item.name,
              }))}
              onNotesChange={setDietaryNotes}
            />
          </div>
        </Disclosure>

        {/* Closed, but bookable. Offered here rather than buried in the
            pickup-time disclosure, because right now it is the only way
            forward and the student has no reason to go looking for it. */}
        {closedNames.length > 0 ? (
          <div
            className={cn(
              "space-y-3 rounded-2xl border p-4",
              scheduledPickupTime
                ? "border-success/25 bg-success-soft"
                : "border-warning/25 bg-warning-soft"
            )}
          >
            <div>
              <p
                className={cn(
                  "text-sm font-bold",
                  scheduledPickupTime ? "text-success" : "text-warning"
                )}
              >
                {scheduledPickupTime
                  ? `Booked for ${scheduledPickupTime.toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}`
                  : `${closedNames.join(" and ")} ${
                      closedNames.length === 1 ? "is" : "are"
                    } closed right now`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {scheduledPickupTime
                  ? "The kitchen will have it ready for then. You still pay at the counter."
                  : "You can still place this as a booking — pick when you want to collect it."}
              </p>
            </div>

            <OrderScheduling
              onScheduleChange={(scheduledTime, timeSlot) => {
                setScheduledPickupTime(scheduledTime)
                setPreferredTimeSlot(timeSlot)
              }}
            />
          </div>
        ) : null}

        {/* Bill */}
        <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Bill details</h2>

          <dl className="space-y-2 text-sm">
            {/* One line per canteen when the cart spans more than one. Each
                is a separate order, cooked by a different kitchen and paid
                for at a different counter, so a single merged "item total"
                is a number nobody is ever asked for. */}
            {splitOrder ? (
              orderGroups.map((group) => (
                <div key={group.canteenId} className="flex justify-between">
                  <dt className="min-w-0 truncate text-muted-foreground">
                    {group.canteenName}{" "}
                    <span className="text-xs">
                      ({group.count} {group.count === 1 ? "item" : "items"})
                    </span>
                  </dt>
                  <dd className="shrink-0 tabular-nums text-foreground">
                    ₹{group.total.toFixed(2)}
                  </dd>
                </div>
              ))
            ) : (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Item total ({itemCount} {itemCount === 1 ? "item" : "items"})
                </dt>
                <dd className="tabular-nums text-foreground">₹{subtotal.toFixed(2)}</dd>
              </div>
            )}

            {appliedDiscount > 0 ? (
              <div className="flex justify-between text-success">
                <dt className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {selectedOffer?.title ?? "Discount"}
                </dt>
                <dd className="tabular-nums">−₹{appliedDiscount.toFixed(2)}</dd>
              </div>
            ) : null}

            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="text-foreground">
                {splitOrder ? "Pay at each counter" : "Pay at the counter"}
              </dd>
            </div>

            <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold">
              <dt>{splitOrder ? `Across ${orderGroups.length} orders` : "To pay"}</dt>
              <dd className="tabular-nums">₹{total.toFixed(2)}</dd>
            </div>
          </dl>

          {splitOrder ? (
            <p className="rounded-xl bg-info-soft px-3 py-2 text-xs text-info">
              This is {orderGroups.length} separate orders with {orderGroups.length} pickup tokens —
              one per canteen. Nothing is combined: each kitchen cooks its own and you pay each
              counter separately.
            </p>
          ) : null}

          {appliedDiscount > 0 ? (
            <p className="rounded-xl bg-success-soft px-3 py-2 text-center text-xs font-bold text-success">
              You save ₹{appliedDiscount.toFixed(2)} on this order
            </p>
          ) : null}
        </div>
      </div>

      <StickyBar>
        <Button
          size="lg"
          block
          loading={loading}
          disabled={cartItems.length === 0 || cannotPlace || checking}
          onClick={handlePlaceOrder}
          className="justify-between"
        >
          <span className="tabular-nums">₹{total.toFixed(2)}</span>
          <span>
            {loading
              ? splitOrder
                ? `Placing ${orderGroups.length} orders…`
                : "Placing order…"
              : checking
                ? "Checking…"
                : cannotPlace
                  ? needsSchedule
                    ? "Choose a time"
                    : "Fix cart to continue"
                  : splitOrder
                    ? `Place ${orderGroups.length} orders`
                    : "Place order"}
          </span>
        </Button>
      </StickyBar>
    </>
  )
}
