"use client"

import { useCartStore } from "@/store/cart-store"
import { useMounted } from "./use-mounted"

/**
 * Cart totals for chrome that renders on the server (app bar, tab bar).
 * The store is persisted to localStorage, so it reads 0 on the server; we hold
 * that value until mount to keep the first client render identical.
 */
export function useCartCount() {
  const mounted = useMounted()
  const count = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  )
  const total = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  return {
    count: mounted ? count : 0,
    total: mounted ? total : 0,
    ready: mounted,
  }
}
