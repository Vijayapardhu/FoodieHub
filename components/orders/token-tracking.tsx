"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import { ArrowLeft, Phone, X, RotateCcw, Printer, Download, FileText } from "lucide-react"
import Link from "next/link"
import { useRealtimeOrders } from "@/lib/hooks/use-realtime-orders"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/store/cart-store"
import { downloadInvoice, printInvoice } from "@/lib/utils/invoice"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
  users?: {
    full_name: string | null
    email: string | null
  } | null
}

interface TokenTrackingProps {
  order: Order
}

const statusSteps = [
  { key: "pending", label: "Order Placed", progress: 0 },
  { key: "confirmed", label: "Confirmed", progress: 25 },
  { key: "preparing", label: "Preparing", progress: 50 },
  { key: "ready", label: "Ready", progress: 75 },
  { key: "completed", label: "Completed", progress: 100 },
]

export function TokenTracking({ order: initialOrder }: TokenTrackingProps) {
  const [order, setOrder] = useState(initialOrder)
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { addItem, clearCart } = useCartStore()

  const realtimeOrder = useRealtimeOrders(order.id, (updatedOrder) => {
    setOrder(updatedOrder as Order)
  })

  useEffect(() => {
    if (realtimeOrder) {
      setOrder(realtimeOrder as Order)
    }
  }, [realtimeOrder])

  const currentStep = statusSteps.findIndex((step) => step.key === order.status)
  const progress = statusSteps[currentStep]?.progress || 0

  const canCancel = order.status === "pending" || order.status === "confirmed"
  const canReorder = order.status === "completed" || order.status === "cancelled"

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return
    }

    try {
      setCancelling(true)
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id)

      if (error) throw error

      toast.success("Order cancelled successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order")
    } finally {
      setCancelling(false)
    }
  }

  const handleReorder = () => {
    if (!order.order_items || order.order_items.length === 0) {
      toast.error("No items to reorder")
      return
    }

    // Clear current cart for this canteen
    const canteenId = order.canteen_id
    clearCart()

    // Add all items from this order
    order.order_items.forEach((orderItem) => {
      for (let i = 0; i < orderItem.quantity; i++) {
        addItem({
          itemId: orderItem.item_id,
          name: orderItem.items.name,
          price: Number(orderItem.price),
          imageUrl: orderItem.items.image_url,
          canteenId: canteenId,
          canteenName: order.canteens?.name || "Canteen",
        })
      }
    })

    toast.success("Items added to cart!")
    router.push(`/cart?canteen=${canteenId}`)
  }

  const handlePrintReceipt = () => {
    try {
      printInvoice(order)
      toast.success("Opening print dialog...")
    } catch (error: any) {
      toast.error("Failed to print invoice")
      console.error("Print error:", error)
    }
  }

  const handleDownloadInvoice = () => {
    try {
      downloadInvoice(order)
      toast.success("Invoice downloaded successfully")
    } catch (error: any) {
      toast.error("Failed to download invoice")
      console.error("Download error:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <button className="rounded-full p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-2xl font-bold">Token Tracking</h1>
      </div>

      {/* Order Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status Steps */}
          <div className="space-y-3">
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStep
              const isCurrent = index === currentStep

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 rounded-lg p-3 ${
                    isActive ? "bg-primary/10" : "bg-muted/50"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {isActive ? "✓" : index + 1}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isCurrent ? "text-primary" : ""
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && order.status === "preparing" && (
                      <p className="text-sm text-muted-foreground">
                        Estimated wait time: 15-20 minutes
                      </p>
                    )}
                    {isCurrent && order.status === "ready" && (
                      <p className="text-sm text-muted-foreground">
                        Your order is ready for pickup!
                      </p>
                    )}
                  </div>
                  {isCurrent && (
                    <Badge className="bg-primary">Current</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Token & QR Code */}
      <Card>
        <CardHeader>
          <CardTitle>Your Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-6">
            <div className="rounded-lg border-2 border-primary p-4">
              <QRCodeSVG value={order.token} size={120} />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Token Code</p>
              <p className="text-4xl font-mono font-bold text-primary">
                {order.token}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Show this at the canteen
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {(order.order_items ?? []).map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.items.image_url ? (
                    <Image
                      src={item.items.image_url}
                      alt={item.items.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <ImagePlaceholder type="item" size="sm" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.items.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                  <p className="font-semibold text-primary">
                    ₹{Number(item.price).toFixed(2)} × {item.quantity} = ₹
                    {(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">
                ₹{Number(order.total_amount).toFixed(2)}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Canteen: {order.canteens?.name ?? "Canteen"}
            </p>
            <p className="text-sm text-muted-foreground">
              Order placed: {format(new Date(order.created_at), "PPpp")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {canCancel && (
          <Button
            onClick={handleCancelOrder}
            disabled={cancelling}
            variant="outline"
            className="flex-1 gap-2 border-destructive text-destructive hover:bg-destructive/10"
            size="lg"
          >
            <X className="h-4 w-4" />
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </Button>
        )}
        {canReorder && (
          <Button
            onClick={handleReorder}
            variant="outline"
            className="flex-1 gap-2"
            size="lg"
          >
            <RotateCcw className="h-4 w-4" />
            Reorder
          </Button>
        )}
        <div className="flex gap-2">
          <Button
            onClick={handlePrintReceipt}
            variant="outline"
            className="gap-2"
            size="lg"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
          <Button
            onClick={handleDownloadInvoice}
            variant="outline"
            className="gap-2 bg-primary text-white hover:bg-primary/90"
            size="lg"
          >
            <FileText className="h-4 w-4" />
            Download Invoice
          </Button>
        </div>
        {(order.status === "completed" || order.status === "cancelled") && (
          <Link href={`/orders/${order.id}/feedback`} className="flex-1">
            <Button className="w-full gap-2 bg-primary text-white hover:bg-primary/90" size="lg">
              Submit Feedback
            </Button>
          </Link>
        )}
      </div>

      {/* Contact Canteen */}
      <Card>
        <CardHeader>
          <CardTitle>
            Need to talk to {order.canteens?.name ?? "the canteen"}?
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            {order.canteens?.contact_phone
              ? "Call the kitchen directly for special instructions or urgent updates."
              : "This canteen hasn’t shared a phone number yet."}
          </p>
          {order.canteens?.contact_phone && (
            <Button asChild className="gap-2 rounded-full px-6">
              <a href={`tel:${order.canteens.contact_phone}`}>
                <Phone className="h-4 w-4" />
                Call now
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

