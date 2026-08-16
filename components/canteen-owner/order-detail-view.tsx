"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import { Mail, Phone, Printer, User } from "lucide-react"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Badge } from "@/components/ui/badge"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { StickyBar } from "@/components/ui/sticky-bar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ORDER_STATUS_META,
  nextStatus,
  type OrderStatus,
} from "@/lib/utils/order-status"
import { printInvoice } from "@/lib/utils/invoice"
import { etaDetail, etaLabel, orderEta } from "@/lib/utils/eta"
import { CustomerHistory } from "@/components/canteen-owner/customer-history"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  users: Database["public"]["Tables"]["users"]["Row"] | null
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
}

const advanceLabel: Partial<Record<OrderStatus, string>> = {
  pending: "Accept order",
  confirmed: "Start cooking",
  preparing: "Mark ready",
  ready: "Hand over & complete",
}

const DECLINE_REASONS = [
  "Sold out of an item",
  "Kitchen is closing",
  "Too busy to take this on",
  "Can't make it in time",
]

export function OrderDetailView({ order }: { order: Order }) {
  const router = useRouter()
  const [cashReceived, setCashReceived] = useState("")
  const [loading, setLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [declineReason, setDeclineReason] = useState("")

  const status = order.status as OrderStatus
  const next = nextStatus(status)
  const label = advanceLabel[status]
  const total = Number(order.total_amount)
  const cash = Number(cashReceived)
  const change = cash > total ? cash - total : 0
  const cashIsShort = cashReceived !== "" && cash < total
  const settled = order.payment_status === "completed"

  const eta = orderEta(order)
  const etaText = etaLabel(eta)
  const live = status !== "completed" && status !== "cancelled"

  /**
   * Push the estimate back when the queue is longer than usual.
   *
   * The customer's screen reads from this field, so a kitchen that knows it
   * is running twenty minutes behind can say so instead of leaving somebody
   * standing at the counter wondering.
   */
  const addMinutes = async (minutes: number) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("orders")
        .update({
          estimated_preparation_time:
            (order.estimated_preparation_time ?? 20) + minutes,
        })
        .eq("id", order.id)
      if (error) throw error

      toast.success(`Estimate pushed back ${minutes} minutes`)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update the estimate")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (value: OrderStatus) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("orders")
        .update({ status: value })
        .eq("id", order.id)
      if (error) throw error

      toast.success(`Order ${ORDER_STATUS_META[value].label.toLowerCase()}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update this order")
    } finally {
      setLoading(false)
    }
  }

  const recordPayment = async () => {
    if (cashIsShort || cashReceived === "") {
      toast.error("Cash received must cover the order total")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "completed",
          cash_received: cash,
          change_amount: change,
        })
        .eq("id", order.id)
      if (error) throw error

      toast.success(
        change > 0
          ? `Payment recorded · return ₹${change.toFixed(2)}`
          : "Payment recorded"
      )
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not record the payment")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    const reason = declineReason.trim()
    if (!reason) {
      toast.error("Say why, so the customer isn't left guessing")
      return
    }

    setCancelling(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled", decline_reason: reason })
        .eq("id", order.id)
      if (error) throw error

      toast.success("Order declined — the customer has been told why")
      setCancelOpen(false)
      setDeclineReason("")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not decline this order")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Token — the thing the counter matches against the customer's phone */}
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center">
          <StatusBadge status={status} />
          <p className="font-mono text-4xl font-black tracking-[0.15em] text-primary">
            {order.token}
          </p>
          <div className="rounded-2xl border-2 border-border bg-white p-3">
            <QRCodeSVG value={order.token} size={132} level="M" />
          </div>
          <p className="text-xs text-muted-foreground">
            Placed {format(new Date(order.created_at), "d MMM, h:mm a")}
          </p>
        </section>

        {live ? (
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div className="min-w-0">
                <CardTitle>Ready by</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {etaDetail(eta) ?? "No estimate on this order"}
                </p>
              </div>
              <span
                className={
                  eta.kind === "overdue"
                    ? "shrink-0 text-sm font-bold text-warning"
                    : "shrink-0 text-sm font-bold text-primary"
                }
              >
                {etaText ?? "—"}
              </span>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => addMinutes(5)}
              >
                +5 min
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => addMinutes(10)}
              >
                +10 min
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => addMinutes(20)}
              >
                +20 min
              </Button>
              <p className="w-full text-xs text-muted-foreground">
                The customer sees this update immediately.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {order.customer_name || order.users?.full_name || "Guest"}
                </span>
              </p>

              {order.customer_phone || order.users?.phone_number ? (
                <a
                  href={`tel:${order.customer_phone || order.users?.phone_number}`}
                  className="flex items-center gap-2 text-primary"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  {order.customer_phone || order.users?.phone_number}
                </a>
              ) : null}

              {order.user_id ? (
                <CustomerHistory
                  userId={order.user_id}
                  canteenId={order.canteen_id}
                />
              ) : null}

              {order.users?.email ? (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{order.users.email}</span>
                </p>
              ) : null}

              {order.scheduled_pickup_time ? (
                <p className="rounded-xl bg-info-soft p-2.5 text-info">
                  Scheduled pickup:{" "}
                  {format(
                    new Date(order.scheduled_pickup_time),
                    "d MMM, h:mm a"
                  )}
                </p>
              ) : null}

              {order.special_instructions ? (
                <div className="rounded-xl bg-warning-soft p-2.5">
                  <p className="text-xs font-semibold text-warning">
                    Special instructions
                  </p>
                  <p className="mt-0.5 text-warning">
                    {order.special_instructions}
                  </p>
                </div>
              ) : null}

              {order.dietary_notes ? (
                <div className="rounded-xl bg-destructive-soft p-2.5">
                  <p className="text-xs font-semibold text-destructive">
                    Dietary notes
                  </p>
                  <p className="mt-0.5 text-destructive">
                    {order.dietary_notes}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Payment</CardTitle>
              <Badge variant={settled ? "success" : "warning"} size="sm">
                {settled ? "Paid" : "Due at counter"}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  Order total
                </span>
                <span className="text-xl font-bold tabular-nums text-foreground">
                  ₹{total.toFixed(2)}
                </span>
              </div>

              {settled ? (
                <dl className="space-y-1.5 rounded-xl bg-success-soft p-3 text-sm text-success">
                  <div className="flex justify-between">
                    <dt>Cash received</dt>
                    <dd className="tabular-nums">
                      ₹{Number(order.cash_received || 0).toFixed(2)}
                    </dd>
                  </div>
                  {Number(order.change_amount) > 0 ? (
                    <div className="flex justify-between">
                      <dt>Change returned</dt>
                      <dd className="tabular-nums">
                        ₹{Number(order.change_amount).toFixed(2)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="cash-received"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Cash received
                    </label>
                    <Input
                      id="cash-received"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.5"
                      placeholder={total.toFixed(2)}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      invalid={cashIsShort}
                    />
                  </div>

                  {/* Quick notes save the cashier arithmetic at a busy counter */}
                  <div className="flex flex-wrap gap-2">
                    {[total, 100, 200, 500].map((amount, index) => (
                      <button
                        key={`${amount}-${index}`}
                        type="button"
                        onClick={() => setCashReceived(String(amount))}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors active:bg-muted"
                      >
                        ₹{Number(amount).toFixed(0)}
                      </button>
                    ))}
                  </div>

                  {cashIsShort ? (
                    <p className="text-sm font-medium text-destructive">
                      Short by ₹{(total - cash).toFixed(2)}
                    </p>
                  ) : change > 0 ? (
                    <p className="rounded-xl bg-success-soft p-3 text-center text-success">
                      Return change{" "}
                      <strong className="text-lg tabular-nums">
                        ₹{change.toFixed(2)}
                      </strong>
                    </p>
                  ) : null}

                  <Button
                    block
                    onClick={recordPayment}
                    loading={loading}
                    disabled={cashReceived === "" || cashIsShort}
                  >
                    Record payment
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>
              {order.order_items?.length ?? 0} items
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => printInvoice(order)}
            >
              <Printer className="h-4 w-4" />
              Print bill
            </Button>
          </CardHeader>

          <CardContent>
            <ul className="divide-y divide-border">
              {(order.order_items ?? []).map((line) => (
                <li key={line.id} className="flex items-center gap-3 py-3">
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

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {line.items?.name ?? "Item"}
                    </span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      ₹{Number(line.price).toFixed(2)} each
                    </span>
                  </span>

                  <span className="shrink-0 rounded-lg bg-primary-soft px-2.5 py-1 text-sm font-bold tabular-nums text-primary">
                    ×{line.quantity}
                  </span>

                  <span className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">
                    ₹{(Number(line.price) * line.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {next && label ? (
        <StickyBar aboveTabBar context="console">
          <div className="flex gap-2">
            {status === "pending" || status === "confirmed" ? (
              <Button
                variant="outline"
                size="lg"
                className="border-destructive/40 text-destructive hover:bg-destructive-soft"
                onClick={() => setCancelOpen(true)}
                disabled={loading}
              >
                Decline
              </Button>
            ) : null}
            <Button
              size="lg"
              className="flex-1"
              loading={loading}
              onClick={() => updateStatus(next)}
            >
              {label}
            </Button>
          </div>
        </StickyBar>
      ) : null}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline order #{order.token}?</DialogTitle>
            <DialogDescription>
              The customer is told immediately, in your words. Nothing was
              paid, so there is nothing to refund — but they are waiting for
              food, so tell them why it isn&apos;t coming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-1">
            {/* The four honest reasons a kitchen actually turns an order
                down. One tap beats typing on a counter phone mid-rush. */}
            <div className="flex flex-wrap gap-2">
              {DECLINE_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setDeclineReason(reason)}
                  className={
                    declineReason === reason
                      ? "rounded-full border border-primary bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
                      : "rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                  }
                >
                  {reason}
                </button>
              ))}
            </div>

            <Input
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Or write your own"
              aria-label="Reason for declining"
              maxLength={140}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setCancelOpen(false)}
              disabled={cancelling}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              block
              loading={cancelling}
              disabled={!declineReason.trim()}
              onClick={handleCancel}
            >
              Decline order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
