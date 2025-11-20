"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database.types"

type OrderWithRelations = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
}

export function useRealtimeOrders(
  orderId: string | null,
  onUpdate?: (order: OrderWithRelations) => void
) {
  const [order, setOrder] = useState<OrderWithRelations | null>(null)
  const supabase = createClient()
  const orderSelect = `
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

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select(orderSelect)
        .eq("id", orderId)
        .single()

      if (data) {
        setOrder(data as OrderWithRelations)
        onUpdate?.(data as OrderWithRelations)
      }
    }

    fetchOrder()

    // Subscribe to real-time updates
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
  }, [orderId, supabase, onUpdate])

  return order
}

