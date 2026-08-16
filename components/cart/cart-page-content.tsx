"use client"

import { useMemo } from "react"
import { ShoppingCart, TriangleAlert, X } from "@/components/ui/icons"
import { useCartStore } from "@/store/cart-store"
import { useMounted } from "@/lib/hooks/use-mounted"
import { useCartValidation } from "@/lib/hooks/use-cart-validation"
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
  const removeItems = useCartStore((state) => state.removeItems)

  const scoped = useMemo(
    () =>
      canteenId ? items.filter((i) => i.canteenId === canteenId) : items,
    [items, canteenId]
  )

  const validation = useCartValidation(scoped)

  const groups = useMemo(() => {
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
  }, [scoped])

  // The cart lives in localStorage, so nothing is known until after hydration.
  if (!mounted) {
    return <ListSkeleton count={3} />
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        art="cart"
        title="Your cart is empty"
        description="Browse the canteens and add something you fancy — you pay at the counter when you collect."
        action={{ label: "Browse canteens", href: "/home" }}
        secondaryAction={{ label: "Past orders", href: "/orders" }}
      />
    )
  }

  const repriced = validation.issues.filter((issue) => issue.kind === "repriced")
  const soldOut = validation.issues.filter(
    (issue) => issue.kind === "unavailable"
  )

  return (
    <div className="space-y-4">
      {/* Sold out first: it is the one thing that stops the order going
          through, and it comes with the tap that fixes it. */}
      {soldOut.length > 0 ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive-soft p-3.5">
          <p className="flex items-start gap-2 text-sm font-semibold text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {soldOut.length === 1
                ? `${soldOut[0].name} has sold out`
                : `${soldOut.length} items have sold out`}
            </span>
          </p>
          <p className="mt-1 pl-6 text-xs text-destructive/90">
            The kitchen can&apos;t make{" "}
            {soldOut.length === 1 ? "it" : "them"} today. Remove{" "}
            {soldOut.length === 1 ? "it" : "them"} to place the rest of your
            order.
          </p>
          <button
            type="button"
            onClick={() => removeItems(soldOut.map((issue) => issue.itemId))}
            className="mt-2.5 ml-6 rounded-xl bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground active:scale-[0.98]"
          >
            Remove sold-out {soldOut.length === 1 ? "item" : "items"}
          </button>
        </div>
      ) : null}

      {/* A price change is not an error, but it must never be silent: the
          counter charges the new price whatever the cart remembered. */}
      {repriced.length > 0 ? (
        <div className="flex items-start gap-2 rounded-2xl border border-info/25 bg-info-soft p-3.5 text-sm text-info">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {repriced.length === 1 ? "A price has" : "Some prices have"}{" "}
              changed
            </p>
            <ul className="mt-1 space-y-0.5 text-xs">
              {repriced.map((issue) => (
                <li key={issue.itemId} className="tabular-nums">
                  {issue.name} · ₹{issue.was?.toFixed(2)} → ₹
                  {issue.now?.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={validation.dismissRepriced}
            aria-label="Dismiss"
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 active:bg-info/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

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
          state={validation.canteens.get(group.canteenId)}
          unavailableIds={validation.unavailableIds}
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

      <CartSummary
        canteenId={canteenId}
        unavailableIds={validation.unavailableIds}
        blocked={validation.blocked}
        checking={validation.checking}
        closedIds={validation.closedIds}
      />
    </div>
  )
}
