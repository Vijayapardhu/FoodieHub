"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { useMounted } from "@/lib/hooks/use-mounted"
import { StickyBar } from "@/components/ui/sticky-bar"
import { cartPath } from "@/lib/utils/public-id"

/**
 * Floating summary that appears once the cart has something in it. Anchored
 * above the tab bar so it never covers navigation.
 */
export function StickyCart({
  canteenId,
  canteenSlug,
}: {
  canteenId: string
  canteenSlug?: string | null
}) {
  const mounted = useMounted()
  const itemCount = useCartStore((state) =>
    state.items
      .filter((i) => i.canteenId === canteenId)
      .reduce((sum, i) => sum + i.quantity, 0)
  )
  const total = useCartStore((state) =>
    state.items
      .filter((i) => i.canteenId === canteenId)
      .reduce((sum, i) => sum + i.price * i.quantity, 0)
  )

  if (!mounted || itemCount === 0) return null

  return (
    <StickyBar>
      <Link
        href={cartPath({ id: canteenId, slug: canteenSlug })}
        className="flex h-14 items-center justify-between gap-3 rounded-2xl bg-brand-gradient px-4 text-primary-foreground shadow-brand transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <ShoppingCart className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">
              {itemCount}
            </span>
          </span>
          <span className="text-left">
            <span className="block text-xs font-medium opacity-90">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="block text-base font-bold tabular-nums">
              ₹{total.toFixed(2)}
            </span>
          </span>
        </span>

        <span className="text-sm font-bold uppercase tracking-wide">
          View cart →
        </span>
      </Link>
    </StickyBar>
  )
}
