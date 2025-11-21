"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart-store"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useMemo, useState } from "react"
import toast from "react-hot-toast"
import { OffersSelector } from "./offers-selector"
import { Textarea } from "@/components/ui/textarea"
import { OrderScheduling } from "./order-scheduling"
import { OrderTemplates } from "./order-templates"
import { DietaryPreferences } from "./dietary-preferences"
import { LoyaltyPointsDisplay } from "./loyalty-points-display"

interface CartSummaryProps {
  canteenId: string | null
}

export function CartSummary({ canteenId }: CartSummaryProps) {
  const router = useRouter()
  const supabase = createClient()
  const { items, getItemsByCanteen } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [discount, setDiscount] = useState(0)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [scheduledPickupTime, setScheduledPickupTime] = useState<Date | null>(null)
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string | null>(null)
  const [dietaryNotes, setDietaryNotes] = useState("")

  const cartItems = canteenId ? getItemsByCanteen(canteenId) : items

  const groupedItems = useMemo(() => {
    return items.reduce<Record<string, typeof items>>((acc, item) => {
      if (!acc[item.canteenId]) {
        acc[item.canteenId] = []
      }
      acc[item.canteenId].push(item)
      return acc
    }, {})
  }, [items])

  const activeGroups = canteenId
    ? [[canteenId, cartItems] as const]
    : Object.entries(groupedItems)

  const computeSubtotal = (list: typeof items) =>
    list.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const subtotal = canteenId
    ? computeSubtotal(cartItems)
    : activeGroups.reduce((sum, [, groupItems]) => sum + computeSubtotal(groupItems), 0)

  const total = canteenId ? Math.max(0, subtotal - discount) : subtotal

  const handlePlaceOrder = async () => {
    if (activeGroups.length === 0 || cartItems.length === 0 && !!canteenId) {
      toast.error("Your cart is empty")
      return
    }

    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please login again")
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
      const customerPhone = profile?.phone_number || null

      const createdOrderIds: string[] = []

      for (const [groupCanteenId, groupItems] of activeGroups) {
        if (groupItems.length === 0) continue

        const groupSubtotal = computeSubtotal(groupItems)
        const groupTotal =
          canteenId && groupCanteenId === canteenId
            ? Math.max(0, groupSubtotal - discount)
            : groupSubtotal

        const token = Math.random().toString(36).substring(2, 8).toUpperCase()

        const orderData: any = {
          user_id: user.id,
          canteen_id: groupCanteenId,
          token,
          status: "pending",
          total_amount: groupTotal,
          payment_method: "on_shop",
          payment_status: "pending",
          customer_name: customerName,
          customer_phone: customerPhone,
          order_type: scheduledPickupTime ? "scheduled" : "immediate",
          special_instructions: specialInstructions.trim() || null,
          dietary_notes: dietaryNotes.trim() || null,
        }

        if (scheduledPickupTime && groupCanteenId === canteenId) {
          orderData.scheduled_pickup_time = scheduledPickupTime.toISOString()
          orderData.preferred_time_slot = preferredTimeSlot
        }

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert(orderData)
          .select()
          .single()

        if (orderError) throw orderError
        createdOrderIds.push(order.id)

        const orderItems = groupItems.map((item) => ({
          order_id: order.id,
          item_id: item.itemId,
          quantity: item.quantity,
          price: item.price,
        }))

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems)

        if (itemsError) throw itemsError

        groupItems.forEach((item) => {
          useCartStore.getState().removeItem(item.itemId)
        })
      }

      if (createdOrderIds.length === 0) {
        toast.error("Unable to create orders. Please try again.")
        return
      }

      toast.success(
        createdOrderIds.length === 1
          ? "Order placed successfully!"
          : `Created ${createdOrderIds.length} orders (one per canteen)`
      )

      if (createdOrderIds.length === 1) {
        router.push(`/orders/${createdOrderIds[0]}`)
      } else {
        router.push("/orders")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canteenId && activeGroups.length > 0 && (
          <div className="rounded-2xl border border-dashed border-orange-100/80 bg-orange-50/50 p-4 text-sm text-muted-foreground">
            <p>
              Checkout will create {activeGroups.length}{" "}
              {activeGroups.length === 1 ? "order" : "orders"}, one per canteen. Each
              order gets its own pickup token.
            </p>
            <div className="mt-3 space-y-2 text-foreground">
              {activeGroups.map(([groupCanteenId, groupItems]) => (
                <div key={groupCanteenId} className="flex items-center justify-between">
                  <span className="font-medium">
                    {groupItems[0]?.canteenName ?? "Canteen"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ₹{computeSubtotal(groupItems).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {canteenId && (
          <>
            <LoyaltyPointsDisplay canteenId={canteenId} orderAmount={total} />
            <OrderTemplates canteenId={canteenId} />
            <OffersSelector
              canteenId={canteenId}
              orderAmount={subtotal}
              onOfferSelected={(offer, discountAmount) => {
                setSelectedOffer(offer)
                setDiscount(discountAmount)
              }}
            />
            <OrderScheduling
              onScheduleChange={(scheduledTime, timeSlot) => {
                setScheduledPickupTime(scheduledTime)
                setPreferredTimeSlot(timeSlot)
              }}
            />
            <DietaryPreferences
              cartItems={cartItems.map((item) => ({
                itemId: item.itemId,
                name: item.name,
              }))}
              onNotesChange={setDietaryNotes}
            />
          </>
        )}
        <div className="space-y-2">
          <label htmlFor="special-instructions" className="text-sm font-medium">
            Special Instructions (Optional)
          </label>
          <Textarea
            id="special-instructions"
            placeholder="Add any special instructions for your order..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="min-h-[80px] resize-none rounded-lg"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {specialInstructions.length}/500 characters
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span>On Shop Payment</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <Button
          onClick={handlePlaceOrder}
          disabled={loading || cartItems.length === 0}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          {loading ? "Placing Order..." : "Checkout"}
        </Button>
      </CardContent>
    </Card>
  )
}

