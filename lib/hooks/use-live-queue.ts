"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface QueueLine {
  quantity: number
  name: string
}

export interface QueueOrder {
  id: string
  token: string
  status: string
  total_amount: number
  created_at: string
  estimated_preparation_time: number | null
  scheduled_pickup_time: string | null
  special_instructions: string | null
  dietary_notes: string | null
  customer_name: string | null
  customer_phone: string | null
  fulfillment_type: "pickup" | "delivery"
  delivery_blocks: { name: string } | null
  users: { email: string; full_name: string | null } | null
  lines: QueueLine[]
}

const SELECT =
  "id, token, status, total_amount, created_at, estimated_preparation_time, scheduled_pickup_time, special_instructions, dietary_notes, customer_name, customer_phone, fulfillment_type, delivery_blocks(name), users(email, full_name), order_items(quantity, items(name))"

function shape(rows: any[]): QueueOrder[] {
  return rows.map((row) => ({
    ...row,
    lines: (row.order_items ?? []).map((line: any) => ({
      quantity: line.quantity,
      name: line.items?.name ?? "Item",
    })),
  }))
}

/**
 * The kitchen queue, kept live.
 *
 * The console used to render the queue on the server and only re-fetch when
 * the owner themselves pressed something — so an order placed while nobody
 * touched the screen simply did not appear. A canteen would find out about it
 * when a student turned up asking. Realtime existed in the codebase but was
 * never wired to this screen.
 *
 * `initial` is the server-rendered list, so the first paint is instant and the
 * subscription takes over from there.
 */
export function useLiveQueue(
  canteenId: string,
  initial: QueueOrder[],
  statuses: string[]
) {
  const [orders, setOrders] = useState<QueueOrder[]>(initial)
  /** Bumped whenever a genuinely new order arrives, for the alert sound. */
  const [arrived, setArrived] = useState(0)
  const known = useRef<Set<string>>(new Set(initial.map((o) => o.id)))
  const statusKey = statuses.join(",")

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("orders")
      .select(SELECT)
      .eq("canteen_id", canteenId)
      .in("status", statusKey.split(","))
      // Oldest first: whoever has been waiting longest is served next.
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[queue] refresh", error)
      return
    }

    const next = shape(data ?? [])

    // Only count arrivals that are actually new to this session, so a status
    // change on an existing order doesn't ring the bell.
    const fresh = next.filter((order) => !known.current.has(order.id))
    next.forEach((order) => known.current.add(order.id))
    if (fresh.length > 0) setArrived((n) => n + fresh.length)

    setOrders(next)
  }, [canteenId, statusKey])

  useEffect(() => {
    const supabase = createClient()
    // Catch anything placed between the server render and this subscription.
    refresh()

    const channel = supabase
      .channel(`kitchen-queue:${canteenId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `canteen_id=eq.${canteenId}`,
        },
        () => refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [canteenId, refresh])

  return { orders, refresh, arrived }
}
