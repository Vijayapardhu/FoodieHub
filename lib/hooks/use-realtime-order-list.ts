"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database.types"

type Order = Database["public"]["Tables"]["orders"]["Row"]

export function useRealtimeOrderList(
  canteenId: string | null,
  statuses: string[] = ["pending", "confirmed", "preparing", "ready"]
) {
  const [orders, setOrders] = useState<Order[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!canteenId) return

    // Fetch initial orders
    supabase
      .from("orders")
      .select("*")
      .eq("canteen_id", canteenId)
      .in("status", statuses)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setOrders(data)
        }
      })

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`canteen-orders:${canteenId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `canteen_id=eq.${canteenId}`,
        },
        () => {
          // Refetch orders on any change
          supabase
            .from("orders")
            .select("*")
            .eq("canteen_id", canteenId)
            .in("status", statuses)
            .order("created_at", { ascending: false })
            .then(({ data }) => {
              if (data) {
                setOrders(data)
              }
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [canteenId, statuses, supabase])

  return orders
}

