"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BookmarkCheck, Clock, MessageSquare, Sparkles, TicketPercent } from "lucide-react"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { useCartStore } from "@/store/cart-store"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Disclosure } from "@/components/ui/disclosure"
import { StickyBar } from "@/components/ui/sticky-bar"
import { generateToken } from "@/lib/utils/token"
import { OffersSelector } from "./offers-selector"
import { OrderScheduling } from "./order-scheduling"
import { OrderTemplates } from "./order-templates"
import { DietaryPreferences } from "./dietary-preferences"

type Offer = Database["public"]["Tables"]["offers"]["Row"]

interface CartSummaryProps {
  canteenId: string | null
}

export function CartSummary({ canteenId }: CartSummaryProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const items = useCartStore((state) => state.items)

  const [loading, setLoading] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [discount, setDiscount] = useState(0)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [scheduledPickupTime, setScheduledPickupTime] = useState<Date | null>(
    null
  )
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string | null>(null)
  const [dietaryNotes, setDietaryNotes] = useState("")

  const cartItems = useMemo(
    () => (canteenId ? items.filter((i) => i.canteenId === canteenId) : items),
    [items, canteenId]
  )

  const groups = useMemo(() => {
    if (canteenId) return [{ canteenId, items: cartItems }]

    const map = new Map<string, typeof items>()
    for (const item of items) {
      const list = map.get(item.canteenId) ?? []
      list.push(item)
      map.set(item.canteenId, list)
    }
    return Array.from(map, ([id, groupItems]) => ({
      canteenId: id,
      items: groupItems,
    }))
  }, [items, cartItems, canteenId])

  const sum = (list: typeof items) =>
    list.reduce((total, item) => total + item.price * item.quantity, 0)

  const subtotal = sum(cartItems)
  // Offers are per canteen, so they only apply when checking out one canteen.
  const appliedDiscount = canteenId ? discount : 0
  const total = Math.max(0, subtotal - appliedDiscount)
  const itemCount = cartItems.reduce((n, item) => n + item.quantity, 0)

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty")
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

      const createdOrderHandles: string[] = []

      for (const group of groups) {
        if (group.items.length === 0) continue

        const groupSubtotal = sum(group.items)
        const groupTotal =
          canteenId && group.canteenId === canteenId
            ? Math.max(0, groupSubtotal - appliedDiscount)
            : groupSubtotal

        const orderData: Record<string, unknown> = {
          user_id: user.id,
          canteen_id: group.canteenId,
          token: generateToken(6),
          status: "pending",
          // The database recomputes this from the lines and re-derives the
          // discount from the offer below, so this is only a starting value.
          total_amount: groupTotal,
          // Nominate the offer rather than asserting a discount: the server
          // decides whether it applies and for how much.
          offer_id:
            selectedOffer && group.canteenId === canteenId
              ? selectedOffer.id
              : null,
          payment_method: "on_shop",
          payment_status: "pending",
          customer_name: customerName,
          customer_phone: profile?.phone_number || null,
          order_type: scheduledPickupTime ? "scheduled" : "immediate",
          special_instructions: specialInstructions.trim() || null,
          dietary_notes: dietaryNotes.trim() || null,
        }

        if (scheduledPickupTime && group.canteenId === canteenId) {
          orderData.scheduled_pickup_time = scheduledPickupTime.toISOString()
          orderData.preferred_time_slot = preferredTimeSlot
        }

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert(orderData as any)
          .select()
          .single()

        if (orderError) throw orderError
        // Keep the token, not the uuid: it's what the order is addressed by.
        createdOrderHandles.push(order.token ?? order.id)

        const { error: itemsError } = await supabase.from("order_items").insert(
          group.items.map((item) => ({
            order_id: order.id,
            item_id: item.itemId,
            quantity: item.quantity,
            price: item.price,
          }))
        )

        if (itemsError) throw itemsError

        // Only clear lines that actually made it into an order.
        group.items.forEach((item) => {
          useCartStore.getState().removeItem(item.itemId)
        })
      }

      if (createdOrderHandles.length === 0) {
        toast.error("Could not create your order. Please try again.")
        return
      }

      toast.success(
        createdOrderHandles.length === 1
          ? "Order placed"
          : `${createdOrderHandles.length} orders placed, one per canteen`
      )

      router.push(
        createdOrderHandles.length === 1
          ? `/orders/${createdOrderHandles[0]}`
          : "/orders"
      )
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
                scheduledPickupTime
                  ? scheduledPickupTime.toLocaleString()
                  : "As soon as it's ready"
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
              <label
                htmlFor="special-instructions"
                className="text-sm font-medium text-foreground"
              >
                Special instructions
              </label>
              <Textarea
                id="special-instructions"
                placeholder="e.g. less spicy, extra chutney, pack separately"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                maxLength={500}
              />
              <p className="text-right text-xs text-muted-foreground tabular-nums">
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

        {/* Bill */}
        <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Bill details</h2>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Item total ({itemCount} {itemCount === 1 ? "item" : "items"})
              </dt>
              <dd className="tabular-nums text-foreground">
                ₹{subtotal.toFixed(2)}
              </dd>
            </div>

            {appliedDiscount > 0 ? (
              <div className="flex justify-between text-success">
                <dt className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {selectedOffer?.title ?? "Discount"}
                </dt>
                <dd className="tabular-nums">
                  −₹{appliedDiscount.toFixed(2)}
                </dd>
              </div>
            ) : null}

            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="text-foreground">Pay at the counter</dd>
            </div>

            <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold">
              <dt>To pay</dt>
              <dd className="tabular-nums">₹{total.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <StickyBar>
        <Button
          size="lg"
          block
          loading={loading}
          disabled={cartItems.length === 0}
          onClick={handlePlaceOrder}
          className="justify-between"
        >
          <span className="tabular-nums">₹{total.toFixed(2)}</span>
          <span>{loading ? "Placing order…" : "Place order"}</span>
        </Button>
      </StickyBar>
    </>
  )
}
