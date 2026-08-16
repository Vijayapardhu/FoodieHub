"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database.types"
import { useEventCallback } from "./use-event-callback"

type OrderWithRelations = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
}

const ORDER_SELECT = `
  *,
  canteens:canteens(
    id,
    name,
    contact_phone,
    address,
    address_reference,
    google_maps_url
  ),
  order_items(
    *,
    items(*)
  )
`

/**
 * Live view of a single order. Subscribes to row updates and refetches the
 * joined shape, since postgres_changes payloads carry the base row only.
 */
export function useRealtimeOrders(
  orderId: string | null,
  onUpdate?: (order: OrderWithRelations) => void
) {
  const [order, setOrder] = useState<OrderWithRelations | null>(null)
  // Stable identity: callers pass an inline arrow, which would otherwise
  // re-run the effect every render and thrash the subscription.
  const handleUpdate = useEventCallback(onUpdate ?? (() => {}))

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    const supabase = createClient()
    const { data } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", orderId)
      .maybeSingle()

    if (data) {
      setOrder(data as OrderWithRelations)
      handleUpdate(data as OrderWithRelations)
    }
  }, [orderId, handleUpdate])

  useEffect(() => {
    if (!orderId) return
    const supabase = createClient()

    fetchOrder()

    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => {
          fetchOrder()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, fetchOrder])

  return order
}
