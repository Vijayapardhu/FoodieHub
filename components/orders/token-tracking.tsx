"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import {
  Clock,
  Copy,
  Download,
  MessageSquare,
  Phone,
  Printer,
  RotateCcw,
  Share2,
  Star,
  XCircle,
} from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { OrderTimeline } from "@/components/orders/order-timeline"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRealtimeOrders } from "@/lib/hooks/use-realtime-orders"
import { useCartStore } from "@/store/cart-store"
import { createClient } from "@/lib/supabase/client"
import { downloadInvoice, printInvoice } from "@/lib/utils/invoice"
import { isCustomerCancellable, type OrderStatus } from "@/lib/utils/order-status"
import { cartPath, orderFeedbackPath } from "@/lib/utils/public-id"
import { etaDetail, etaLabel, orderEta } from "@/lib/utils/eta"
import { GroupOrderShare } from "@/components/orders/group-order-share"
import { cn } from "@/lib/utils/cn"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
  users?: { full_name: string | null; email: string | null } | null
  decline_reason?: string | null
  special_instructions?: string | null
  dietary_notes?: string | null
  scheduled_pickup_time?: string | null
}

export function TokenTracking({ order: initialOrder }: { order: Order }) {
  const router = useRouter()
  const [order, setOrder] = useState(initialOrder)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const realtimeOrder = useRealtimeOrders(order.id)

  useEffect(() => {
    if (realtimeOrder) setOrder(realtimeOrder as Order)
  }, [realtimeOrder])

  const status = order.status as OrderStatus

  // Recomputed on a timer so a countdown someone is watching actually counts
  // down, rather than freezing at whatever it said when the page loaded.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (status === "completed" || status === "cancelled") return
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [status])

  const eta = orderEta(order, now)
  const etaText = etaLabel(eta)
  const etaDetailText = etaDetail(eta)

  const canCancel = isCustomerCancellable(status)
  const finished = status === "completed" || status === "cancelled"
  const ready = status === "ready"

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id)
        // Guard against the kitchen accepting it between the tap and the write.
        .in("status", ["pending", "confirmed"])
        .select()
        .maybeSingle()

      if (error) throw error

      setCancelOpen(false)
      toast.success("Order cancelled")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not cancel this order")
    } finally {
      setCancelling(false)
    }
  }

  const handleReorder = () => {
    if (!order.order_items?.length) {
      toast.error("Nothing to reorder")
      return
    }

    const { addItem, items, removeItem } = useCartStore.getState()

    // Replace this canteen's lines only; other canteens' carts stay intact.
    items
      .filter((item) => item.canteenId === order.canteen_id)
      .forEach((item) => removeItem(item.itemId))

    let skipped = 0
    for (const orderItem of order.order_items) {
      if (!orderItem.items?.is_available) {
        skipped++
        continue
      }
      for (let i = 0; i < orderItem.quantity; i++) {
        addItem({
          itemId: orderItem.item_id,
          name: orderItem.items.name,
          price: Number(orderItem.items.price),
          imageUrl: orderItem.items.image_url,
          canteenId: order.canteen_id,
          canteenName: order.canteens?.name || "Canteen",
          itemSlug: orderItem.items.slug ?? null,
          canteenSlug: order.canteens?.slug ?? null,
        })
      }
    }

    if (skipped === order.order_items.length) {
      toast.error("None of these items are available right now")
      return
    }

    toast.success(
      skipped > 0
        ? `Added to cart · ${skipped} item${skipped === 1 ? "" : "s"} unavailable`
        : "Added to cart"
    )
    router.push(cartPath({ id: order.canteen_id, slug: order.canteens?.slug }))
  }

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(order.token)
      toast.success("Token copied")
    } catch {
      toast.error("Could not copy the token")
    }
  }

  const shareToken = async () => {
    const text = `My FoodieHub pickup token at ${
      order.canteens?.name ?? "the canteen"
    } is ${order.token}`

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "FoodieHub token", text })
        return
      } catch {
        // Share sheet dismissed — fall through to the clipboard.
      }
    }
    copyToken()
  }

  return (
    <div className="space-y-5">
      {/* Token card — the one thing the student needs at the counter */}
      <section
        className={
          ready
            ? "rounded-2xl border-2 border-success bg-success-soft p-5 text-center"
            : "rounded-2xl border border-border bg-card p-5 text-center shadow-card"
        }
      >
        <div className="flex items-center justify-center gap-2">
          <StatusBadge status={status} />
          {order.scheduled_pickup_time ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">
              <Clock className="h-3 w-3" />
              {format(new Date(order.scheduled_pickup_time), "d MMM, h:mm a")}
            </span>
          ) : null}
        </div>

        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Pickup token
        </p>
        <p className="font-mono text-5xl font-black tracking-[0.15em] text-primary">
          {order.token}
        </p>

        {/*
         * The code is the handover. It exists so the counter can scan the
         * order off as collected, so it appears when there is something to
         * collect — showing it while the food is still being cooked only
         * invites somebody to wave a phone at a busy kitchen. The token above
         * is on screen the whole time, which is what a student needs while
         * they wait.
         */}
        {ready || status === "completed" ? (
          <div className="mt-4 flex justify-center">
            <div className="rounded-2xl border-2 border-border bg-white p-3">
              <QRCodeSVG value={order.token} size={148} level="M" />
            </div>
          </div>
        ) : null}

        {/* The answer to "when is my food ready", directly under the token
            that answers "which order is mine". */}
        {etaText && !finished ? (
          <p
            className={cn(
              "mt-3 text-base font-bold",
              eta.kind === "overdue" ? "text-warning" : ready ? "text-success" : "text-primary"
            )}
          >
            {etaText}
          </p>
        ) : null}

        <p className="mt-2 text-sm text-muted-foreground">
          Show this at {order.canteens?.name ?? "the counter"} and pay on collection.
        </p>

        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={copyToken}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={shareToken}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </section>

      {order.decline_reason ? (
        <section className="rounded-2xl border border-destructive/30 bg-destructive-soft p-4">
          <p className="text-sm font-bold text-destructive">
            {order.canteens?.name ?? "The canteen"} declined this order
          </p>
          <p className="mt-1 text-sm text-destructive/90">{order.decline_reason}</p>
          <p className="mt-2 text-xs text-destructive/80">
            Nothing was charged — you pay at the counter, and there was no counter to pay at.
          </p>
        </section>
      ) : null}

      {/* Live status */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Order progress</h2>

        <OrderTimeline status={status} />

        {etaDetailText ? (
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            {etaDetailText}
          </p>
        ) : null}
      </section>

      {/* Items */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
          {order.order_items?.length ?? 0} {order.order_items?.length === 1 ? "item" : "items"}
        </h2>

        <ul className="divide-y divide-border">
          {(order.order_items ?? []).map((line) => (
            <li key={line.id} className="flex items-center gap-3 p-3.5">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {line.items?.image_url ? (
                  <Image
                    src={line.items.image_url}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <ImagePlaceholder type="item" size="sm" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold text-foreground">
                  {line.items?.name ?? "Item"}
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  ₹{Number(line.price).toFixed(2)} × {line.quantity}
                </p>
              </div>

              <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                ₹{(Number(line.price) * line.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-border p-4 text-sm">
          {Number(order.discount_amount) > 0 ? (
            <>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Item total</dt>
                <dd className="tabular-nums text-foreground">
                  ₹{Number(order.subtotal).toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between text-success">
                <dt>Discount applied</dt>
                <dd className="tabular-nums">−₹{Number(order.discount_amount).toFixed(2)}</dd>
              </div>
            </>
          ) : null}

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="text-foreground">
              {order.payment_status === "completed" ? "Paid at counter" : "Pay at counter"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Placed</dt>
            <dd className="text-foreground">
              {format(new Date(order.created_at), "d MMM yyyy, h:mm a")}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">₹{Number(order.total_amount).toFixed(2)}</dd>
          </div>
        </dl>
      </section>

      {order.special_instructions || order.dietary_notes ? (
        <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Notes for the kitchen</h2>
          {order.special_instructions ? (
            <p className="text-sm text-muted-foreground">{order.special_instructions}</p>
          ) : null}
          {order.dietary_notes ? (
            <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
              {order.dietary_notes}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Actions */}
      <section className="grid grid-cols-2 gap-2">
        {order.canteens?.contact_phone ? (
          <Button variant="outline" asChild>
            <a href={`tel:${order.canteens.contact_phone}`}>
              <Phone className="h-4 w-4" />
              Call canteen
            </a>
          </Button>
        ) : null}

        {finished ? (
          <Button variant="outline" onClick={handleReorder}>
            <RotateCcw className="h-4 w-4" />
            Reorder
          </Button>
        ) : null}

        <Button variant="outline" onClick={() => printInvoice(order)}>
          <Printer className="h-4 w-4" />
          Print bill
        </Button>

        <Button variant="outline" onClick={() => downloadInvoice(order)}>
          <Download className="h-4 w-4" />
          Save bill
        </Button>

        {/* Only while the kitchen has not started: after that the bill is
            settled and nothing more can be added. */}
        {status === "pending" ? (
          <GroupOrderShare orderId={order.id} existingCode={order.group_order_code ?? null} />
        ) : null}

        {status === "completed" ? (
          <Button className="col-span-2" asChild>
            <Link href={orderFeedbackPath(order)}>
              <Star className="h-4 w-4" />
              Rate this order
            </Link>
          </Button>
        ) : null}

        {canCancel ? (
          <Button
            variant="outline"
            className="col-span-2 border-destructive/40 text-destructive hover:bg-destructive-soft"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancel order
          </Button>
        ) : null}

        {!finished && !canCancel ? (
          <p className="col-span-2 flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            The kitchen has started cooking, so this order can no longer be cancelled from the app.
            Call the canteen if something is wrong.
          </p>
        ) : null}
      </section>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              Token {order.token} at {order.canteens?.name ?? "the canteen"} will be released. You
              can&apos;t undo this, but you can order again any time.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setCancelOpen(false)}
              disabled={cancelling}
            >
              Keep it
            </Button>
            <Button variant="destructive" block loading={cancelling} onClick={handleCancel}>
              Cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
