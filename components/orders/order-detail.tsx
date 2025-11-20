import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
}

interface OrderDetailProps {
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

export function OrderDetail({ order }: OrderDetailProps) {
  const orderUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/orders/${order.id}`
    : ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order Details</h1>
        <Badge className={statusColors[order.status] || "bg-muted"}>
          {order.status}
        </Badge>
      </div>

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
              <p className="mt-2 text-sm text-muted-foreground">
                Show this token at the canteen to collect your order
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Canteen</span>
            <span className="font-semibold">
              {order.canteens?.name ?? "Canteen"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-semibold">On Shop Payment</span>
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
          <div className="border-t pt-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
          <div className="pt-2 text-sm text-muted-foreground">
            <p>Order placed: {format(new Date(order.created_at), "PPpp")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

