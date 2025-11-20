"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Check, X, Clock, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  users: { email: string; full_name: string | null } | null
}

interface OrderManagementProps {
  orders: Order[]
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
  pending: { next: "confirmed", label: "Confirm", icon: Check },
  confirmed: { next: "preparing", label: "Start Preparing", icon: Clock },
  preparing: { next: "ready", label: "Mark Ready", icon: Package },
  ready: { next: "completed", label: "Complete", icon: Check },
}

export function OrderManagement({ orders }: OrderManagementProps) {
  if (orders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const action = statusActions[order.status]
        const customerName =
          order.customer_name || order.users?.full_name || order.users?.email || "Unknown"
        return (
          <Card key={order.id} className="border border-orange-100 shadow-sm">
            <CardContent className="space-y-4 p-4 md:flex md:items-center md:justify-between md:space-y-0">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg font-semibold">{order.token}</span>
                  <Badge className={statusColors[order.status] || "bg-muted"}>
                    {order.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Customer: {customerName}</p>
                <p className="text-sm font-semibold">
                  ₹{Number(order.total_amount).toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href={`/canteen/orders/${order.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
                {action && (
                  <UpdateOrderStatusButton
                    orderId={order.id}
                    nextStatus={action.next}
                    label={action.label}
                    Icon={action.icon}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function UpdateOrderStatusButton({
  orderId,
  nextStatus,
  label,
  Icon,
}: {
  orderId: string
  nextStatus: string
  label: string
  Icon: any
}) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleUpdate = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from("orders")
        .update({ status: nextStatus as any })
        .eq("id", orderId)

      if (error) throw error

      toast.success("Order status updated")
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to update order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleUpdate}
      disabled={loading}
      size="sm"
      className="gap-2"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}

