"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CartItem, useCartStore } from "@/store/cart-store"

/**
 * Checks the cart against the kitchen before anybody commits to it.
 *
 * A cart is a snapshot in localStorage, and it can sit there for days. In that
 * time the canteen closes, the dish sells out, the owner corrects a price. The
 * cart went on displaying the snapshot, so the first anyone heard of any of it
 * was a rejected insert after tapping Place order — the single worst moment to
 * find out, and one that reads as the app being broken rather than the dosa
 * being finished.
 *
 * Price deserves particular care: the database recomputes the order total from
 * live prices, so a stale line meant the bill on screen was not the bill at the
 * counter. Silently repricing would be worse than either, so the new price is
 * taken and the change is stated.
 */

export interface CartLineIssue {
  itemId: string
  name: string
  kind: "unavailable" | "repriced"
  /** Set for `repriced`: what the line used to say, and what it says now. */
  was?: number
  now?: number
}

export interface CanteenState {
  canteenId: string
  name: string
  isOpen: boolean
  /** Minutes until collection, quoted against the queue as it stands now. */
  waitMinutes: number | null
}

export interface CartValidation {
  /** True until the first check completes; the cart is untrusted before then. */
  checking: boolean
  issues: CartLineIssue[]
  canteens: Map<string, CanteenState>
  unavailableIds: Set<string>
  /** Canteen ids that cannot take an order right now. */
  closedIds: Set<string>
  /** Nothing can be ordered until these are cleared. */
  blocked: boolean
  dismissRepriced: () => void
  refresh: () => void
}

export function useCartValidation(items: CartItem[]): CartValidation {
  const [supabase] = useState(() => createClient())
  const [checking, setChecking] = useState(true)
  const [issues, setIssues] = useState<CartLineIssue[]>([])
  const [canteens, setCanteens] = useState<Map<string, CanteenState>>(new Map())
  const [nonce, setNonce] = useState(0)

  const updatePrice = useCartStore((state) => state.updatePrice)

  // Re-check when the set of dishes changes, not on every quantity tap: a
  // stepper press would otherwise fire a round trip per press.
  const itemIds = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.itemId)))
        .sort()
        .join(","),
    [items]
  )
  const canteenIds = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.canteenId)))
        .sort()
        .join(","),
    [items]
  )

  // The check reads prices off the cart, but must not re-run when it corrects
  // them — that would be an endless loop of check, reprice, check.
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    const ids = itemIds ? itemIds.split(",") : []
    const canteenList = canteenIds ? canteenIds.split(",") : []

    if (ids.length === 0) {
      setChecking(false)
      setIssues([])
      setCanteens(new Map())
      return
    }

    let cancelled = false
    setChecking(true)

    const run = async () => {
      try {
        const [itemResult, canteenResult] = await Promise.all([
          supabase
            .from("items")
            .select("id, name, price, is_available")
            .in("id", ids),
          supabase
            .from("canteens")
            .select("id, name, is_open")
            .in("id", canteenList),
        ])

        if (cancelled) return
        if (itemResult.error) throw itemResult.error
        if (canteenResult.error) throw canteenResult.error

        const live = new Map(
          (itemResult.data ?? []).map((row) => [row.id, row])
        )
        const found: CartLineIssue[] = []

        for (const line of itemsRef.current) {
          const row = live.get(line.itemId)

          // A dish that has been deleted outright is unorderable in exactly
          // the same way as one switched off, and reads better as "sold out"
          // than as a missing row.
          if (!row || !row.is_available) {
            found.push({
              itemId: line.itemId,
              name: line.name,
              kind: "unavailable",
            })
            continue
          }

          const price = Number(row.price)
          if (Number.isFinite(price) && price !== line.price) {
            found.push({
              itemId: line.itemId,
              name: row.name ?? line.name,
              kind: "repriced",
              was: line.price,
              now: price,
            })
            updatePrice(line.itemId, price)
          }
        }

        // One wait per canteen, quoted server-side so it matches the estimate
        // the order will actually be given on insert.
        const waits = await Promise.all(
          canteenList.map(async (canteenId) => {
            const orderable = itemsRef.current
              .filter(
                (line) =>
                  line.canteenId === canteenId &&
                  !found.some(
                    (issue) =>
                      issue.itemId === line.itemId &&
                      issue.kind === "unavailable"
                  )
              )
              .map((line) => line.itemId)

            if (orderable.length === 0) return [canteenId, null] as const

            const { data, error } = await supabase.rpc("preview_order_wait", {
              p_canteen_id: canteenId,
              p_item_ids: orderable,
            })
            return [canteenId, error ? null : (data as number | null)] as const
          })
        )

        if (cancelled) return

        const waitByCanteen = new Map(waits)
        const nextCanteens = new Map<string, CanteenState>()
        for (const row of canteenResult.data ?? []) {
          nextCanteens.set(row.id, {
            canteenId: row.id,
            name: row.name,
            isOpen: Boolean(row.is_open),
            waitMinutes: waitByCanteen.get(row.id) ?? null,
          })
        }

        setIssues(found)
        setCanteens(nextCanteens)
      } catch {
        // A failed check must not become a blocked checkout. The database
        // guards still reject a bad order, so the worst case here is the old
        // behaviour rather than a cart nobody can submit.
        if (!cancelled) {
          setIssues([])
          setCanteens(new Map())
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [itemIds, canteenIds, nonce, supabase, updatePrice])

  const unavailableIds = useMemo(
    () =>
      new Set(
        issues
          .filter((issue) => issue.kind === "unavailable")
          .map((issue) => issue.itemId)
      ),
    [issues]
  )

  const closedIds = useMemo(() => {
    const closed = new Set<string>()
    for (const [id, state] of canteens) if (!state.isOpen) closed.add(id)
    return closed
  }, [canteens])

  const blocked = useMemo(() => {
    if (unavailableIds.size > 0) return true
    // Only canteens actually being ordered from matter: an unrelated closed
    // canteen in a multi-canteen cart is the summary's problem, not a block.
    return items.some((item) => closedIds.has(item.canteenId))
  }, [items, unavailableIds, closedIds])

  const dismissRepriced = useCallback(() => {
    setIssues((current) => current.filter((issue) => issue.kind !== "repriced"))
  }, [])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  return {
    checking,
    issues,
    canteens,
    unavailableIds,
    closedIds,
    blocked,
    dismissRepriced,
    refresh,
  }
}
