"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import { ArrowLeft, Phone } from "lucide-react"
import Link from "next/link"
import { useRealtimeOrders } from "@/lib/hooks/use-realtime-orders"
import { useEffect, useState } from "react"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
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
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <span className="text-2xl">🍔</span>
                    </div>
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

      {/* Action Button */}
      <Link href={`/orders/${order.id}/feedback`}>
        <button className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-primary/90">
          Submit Feedback
        </button>
      </Link>

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

