"use client"

import { useMemo } from "react"
import { ShoppingCart } from "@/components/ui/icons"
import { useCartStore } from "@/store/cart-store"
import { useMounted } from "@/lib/hooks/use-mounted"
import { EmptyState } from "@/components/ui/empty-state"
import { ListSkeleton } from "@/components/ui/loading-state"
import { CartGroup } from "@/components/cart/cart-items"
import { CartSummary } from "@/components/cart/cart-summary"
import { CartUpsell } from "@/components/cart/cart-upsell"

interface CartPageContentProps {
  canteenId: string | null
  /** Advertising slot, rendered by the server so an unsold one costs nothing. */
  promo?: React.ReactNode
}

export function CartPageContent({ canteenId, promo }: CartPageContentProps) {
  const mounted = useMounted()
  const items = useCartStore((state) => state.items)

  const groups = useMemo(() => {
    const scoped = canteenId
      ? items.filter((i) => i.canteenId === canteenId)
      : items

    const byCanteen = new Map<
      string,
      { canteenId: string; canteenName: string; items: typeof items }
    >()

    for (const item of scoped) {
      const existing = byCanteen.get(item.canteenId)
      if (existing) {
        existing.items.push(item)
      } else {
        byCanteen.set(item.canteenId, {
          canteenId: item.canteenId,
          canteenName: item.canteenName,
          items: [item],
        })
      }
    }

    return Array.from(byCanteen.values())
  }, [items, canteenId])

  // The cart lives in localStorage, so nothing is known until after hydration.
  if (!mounted) {
    return <ListSkeleton count={3} />
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse the canteens and add something you fancy — you pay at the counter when you collect."
        action={{ label: "Browse canteens", href: "/home" }}
        secondaryAction={{ label: "Past orders", href: "/orders" }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {groups.length > 1 ? (
        <p className="rounded-2xl border border-info/25 bg-info-soft p-3.5 text-sm text-info">
          Your cart spans {groups.length} canteens. Checkout creates one order
          per canteen, each with its own pickup token.
        </p>
      ) : null}

      {groups.map((group) => (
        <CartGroup
          key={group.canteenId}
          canteenId={group.canteenId}
          canteenName={group.canteenName}
          items={group.items}
        />
      ))}

      {/* Only when the cart is from one canteen — suggesting across kitchens
          would split the order into two tokens and defeat the point. */}
      {groups.length === 1 ? (
        <CartUpsell
          canteenId={groups[0].canteenId}
          canteenName={groups[0].canteenName}
        />
      ) : null}

      {/* Below the items, above the bill: seen, but never between somebody
          and the total they are about to pay. */}
      {promo}

      <CartSummary canteenId={canteenId} />
    </div>
  )
}
