"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { Check, X, Clock, Package } from "lucide-react"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  users: Database["public"]["Tables"]["users"]["Row"] | null
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
}

interface OrderDetailViewProps {
  order: Order
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  preparing: "bg-orange-500",
  ready: "bg-green-500",
  completed: "bg-success",
  cancelled: "bg-destructive",
}

const statusActions: Record<string, { next: string; label: string; icon: any }> = {
  pending: { next: "confirmed", label: "Confirm Order", icon: Check },
  confirmed: { next: "preparing", label: "Start Preparing", icon: Clock },
  preparing: { next: "ready", label: "Mark Ready", icon: Package },
  ready: { next: "completed", label: "Complete Order", icon: Check },
}

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const [cashReceived, setCashReceived] = useState("")
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const supabase = createClient()

  const action = statusActions[order.status]
  const changeAmount =
    cashReceived && Number(cashReceived) > Number(order.total_amount)
      ? (Number(cashReceived) - Number(order.total_amount)).toFixed(2)
      : "0.00"

  const handleStatusUpdate = async (nextStatus: string) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from("orders")
        .update({ status: nextStatus as any })
        .eq("id", order.id)

      if (error) throw error

      toast.success("Order status updated")
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to update order")
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!cashReceived || Number(cashReceived) < Number(order.total_amount)) {
      toast.error("Cash received must be greater than or equal to order total")
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "completed",
          cash_received: Number(cashReceived),
          change_amount: Number(changeAmount),
        })
        .eq("id", order.id)

      if (error) throw error

      toast.success("Payment recorded")
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    const canProceed = window.confirm(
      "Cancel this order? This will notify the student and cannot be undone."
    )
    if (!canProceed) return

    try {
      setCancelling(true)
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id)

      if (error) throw error

      toast.success("Order cancelled")
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">Token: {order.token}</p>
        </div>
        <Badge className={statusColors[order.status] || "bg-muted"}>
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Token & QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg border p-4">
                <QRCodeSVG value={order.token} size={128} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Token</p>
                <p className="text-2xl font-mono font-bold">{order.token}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">
                {order.customer_name ||
                  order.users?.full_name ||
                  "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{order.users?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold">
                {order.customer_phone ||
                  order.users?.phone_number ||
                  "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Time</p>
              <p className="font-semibold">
                {format(new Date(order.created_at), "PPpp")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.items.image_url ? (
                    <Image
                      src={item.items.image_url}
                      alt={item.items.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.items.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity}
                  </p>
                  <p className="mt-1 font-semibold">
                    ₹{Number(item.price).toFixed(2)} × {item.quantity} = ₹
                    {(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold">
                ₹{Number(order.total_amount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status</span>
              <Badge
                className={
                  order.payment_status === "completed"
                    ? "bg-success"
                    : "bg-yellow-500"
                }
              >
                {order.payment_status}
              </Badge>
            </div>
            {order.payment_status === "pending" && (
              <>
                <div className="pt-2">
                  <label className="text-sm font-medium">Cash Received</label>
                  <Input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-1"
                    disabled={order.status === "completed"}
                  />
                </div>
                {cashReceived && Number(cashReceived) >= Number(order.total_amount) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Change</span>
                    <span className="font-semibold">₹{changeAmount}</span>
                  </div>
                )}
                <Button
                  onClick={handlePayment}
                  disabled={loading || !cashReceived || Number(cashReceived) < Number(order.total_amount) || order.status === "completed"}
                  className="w-full"
                >
                  Record Payment
                </Button>
              </>
            )}
            {order.payment_status === "completed" && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash Received</span>
                  <span className="font-semibold">
                    ₹{Number(order.cash_received || 0).toFixed(2)}
                  </span>
                </div>
                {order.change_amount && Number(order.change_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Change Given</span>
                    <span className="font-semibold">
                      ₹{Number(order.change_amount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(action || order.status !== "cancelled") && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 md:flex-row">
            {action && (
              <Button
                onClick={() => handleStatusUpdate(action.next)}
                disabled={loading || cancelling || order.status === "completed"}
                className="flex-1"
                size="lg"
              >
                <action.icon className="mr-2 h-5 w-5" />
                {action.label}
              </Button>
            )}
            {order.status !== "cancelled" && order.status !== "completed" && (
              <Button
                type="button"
                variant="outline"
                className={`flex-1 border-destructive text-destructive hover:bg-destructive/10 ${
                  !action ? "" : ""
                }`}
                onClick={handleCancelOrder}
                disabled={cancelling || loading || order.status === "completed"}
                size="lg"
              >
                {cancelling ? "Cancelling..." : "Cancel order"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

