"use client"

import { useCallback } from "react"
import { useCartStore } from "@/store/cart-store"
import { useMounted } from "./use-mounted"

export interface AddableItem {
  id: string
  name: string
  price: number | string
  image_url: string | null
  slug?: string | null
}

/**
 * Add/remove wiring for a single menu item. Centralises the "first tap adds,
 * later taps adjust quantity" rule that every item surface needs.
 */
export function useCartItem(
  item: AddableItem,
  canteenId: string,
  canteenName: string,
  /** Public handle for the canteen, so the cart can link without a uuid. */
  canteenSlug?: string | null
) {
  const mounted = useMounted()
  const storedQuantity = useCartStore(
    (state) => state.items.find((i) => i.itemId === item.id)?.quantity ?? 0
  )
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  // The cart rehydrates from localStorage, so the server render must show 0.
  const quantity = mounted ? storedQuantity : 0

  const increment = useCallback(() => {
    const current = useCartStore
      .getState()
      .items.find((i) => i.itemId === item.id)?.quantity

    if (current) {
      updateQuantity(item.id, current + 1)
      return
    }

    addItem({
      itemId: item.id,
      name: item.name,
      price: Number(item.price),
      imageUrl: item.image_url,
      canteenId,
      canteenName,
      itemSlug: item.slug ?? null,
      canteenSlug: canteenSlug ?? null,
    })
  }, [addItem, updateQuantity, item, canteenId, canteenName, canteenSlug])

  const decrement = useCallback(() => {
    const current = useCartStore
      .getState()
      .items.find((i) => i.itemId === item.id)?.quantity
    if (!current) return
    // updateQuantity removes the line when it drops to zero.
    updateQuantity(item.id, current - 1)
  }, [updateQuantity, item.id])

  return { quantity, increment, decrement, ready: mounted }
}
