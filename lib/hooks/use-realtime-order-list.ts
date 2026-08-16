"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database.types"

type Order = Database["public"]["Tables"]["orders"]["Row"]

const DEFAULT_STATUSES = ["pending", "confirmed", "preparing", "ready"]

/**
 * Live list of a canteen's orders. Any insert/update/delete on the canteen's
 * rows triggers a refetch, so the kitchen queue stays current without polling.
 */
export function useRealtimeOrderList(
  canteenId: string | null,
  statuses: string[] = DEFAULT_STATUSES
) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Callers usually pass an inline array literal; key on the contents so the
  // subscription isn't torn down and rebuilt on every render.
  const statusKey = statuses.join(",")
  const statusList = useMemo(() => statusKey.split(","), [statusKey])

  const fetchOrders = useCallback(async () => {
    if (!canteenId) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("canteen_id", canteenId)
      .in("status", statusList)
      .order("created_at", { ascending: false })

    if (error) console.error("[orders] realtime list", error)
    if (data) setOrders(data)
    setLoading(false)
  }, [canteenId, statusList])

  useEffect(() => {
    if (!canteenId) {
      setLoading(false)
      return
    }
    const supabase = createClient()

    fetchOrders()

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
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [canteenId, fetchOrders])

  return { orders, loading, refresh: fetchOrders }
}
