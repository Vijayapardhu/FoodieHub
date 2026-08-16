"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Plus, Store, Trash2 } from "@/components/ui/icons"
import { CartItem, useCartStore } from "@/store/cart-store"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { canteenPath, itemPath } from "@/lib/utils/public-id"
import type { CanteenState } from "@/lib/hooks/use-cart-validation"
import { cn } from "@/lib/utils/cn"

/**
 * One canteen's worth of cart lines. Each canteen becomes its own order, so
 * the group is the unit that carries a wait, an open/closed state and a
 * subtotal — the three things somebody checks before committing.
 */
export function CartGroup({
  canteenId,
  canteenName,
  items,
  state,
  unavailableIds,
}: {
  canteenId: string
  canteenName: string
  items: CartItem[]
  /** Live canteen state; absent while the first check is still running. */
  state?: CanteenState
  unavailableIds: Set<string>
}) {
  const updateQuantity = useCartStore((store) => store.updateQuantity)
  const removeItem = useCartStore((store) => store.removeItem)

  // Sold-out lines are excluded: they cannot be ordered, and counting them
  // would put a number on screen that the counter will never ask for.
  const subtotal = items.reduce(
    (sum, item) =>
      unavailableIds.has(item.itemId) ? sum : sum + item.price * item.quantity,
    0
  )

  const href = canteenPath({ id: canteenId, slug: items[0]?.canteenSlug })
  const closed = state ? !state.isOpen : false
  const wait = state?.waitMinutes ?? null

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Store className="h-4 w-4" />
          </span>
          <Link
            href={href}
            className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground"
          >
            {canteenName}
          </Link>
          <span className="text-sm font-bold tabular-nums text-foreground">
            ₹{subtotal.toFixed(2)}
          </span>
        </div>

        {/* The answer to the question everyone asks at this point, given
            before the tap rather than on the confirmation screen. */}
        {closed ? (
          <p className="mt-2.5 rounded-xl bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
            This canteen is closed right now. Your cart is saved — you can
            order as soon as it opens.
          </p>
        ) : wait ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
            <Clock className="h-3.5 w-3.5" />
            Ready in about {wait} min
            {items.length > 1 ? (
              <span className="font-normal text-muted-foreground">
                · all {items.length} together
              </span>
            ) : null}
          </p>
        ) : null}
      </header>

      <ul className="divide-y divide-border">
        {items.map((item) => {
          const soldOut = unavailableIds.has(item.itemId)
          const lineTotal = item.price * item.quantity

          return (
            <li
              key={item.itemId}
              className={cn("flex items-center gap-3 p-3.5", soldOut && "bg-muted/40")}
            >
              <Link
                href={itemPath({ id: item.itemId, slug: item.itemSlug })}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className={cn("object-cover", soldOut && "grayscale")}
                  />
                ) : (
                  <ImagePlaceholder type="item" size="md" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={itemPath({ id: item.itemId, slug: item.itemSlug })}>
                  <p
                    className={cn(
                      "line-clamp-2 text-sm font-semibold",
                      soldOut ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {item.name}
                  </p>
                </Link>

                {soldOut ? (
                  <p className="mt-1 inline-flex items-center rounded-md bg-destructive-soft px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-destructive">
                    Sold out
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                    ₹{item.price.toFixed(2)} × {item.quantity}
                  </p>
                )}
              </div>

              {soldOut ? (
                <button
                  type="button"
                  onClick={() => removeItem(item.itemId)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground active:scale-[0.98]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              ) : (
                // Stepper and line total stacked, so the price sits directly
                // under the control that changes it.
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <QuantityStepper
                    size="sm"
                    quantity={item.quantity}
                    onIncrement={() =>
                      updateQuantity(item.itemId, item.quantity + 1)
                    }
                    onDecrement={() =>
                      updateQuantity(item.itemId, item.quantity - 1)
                    }
                    removeAtOne
                    label={item.name}
                  />
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    ₹{lineTotal.toFixed(2)}
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* Going back for one more thing is the most common action left on this
          screen, and it had no button. */}
      <Link
        href={href}
        className="flex items-center justify-center gap-1.5 border-t border-border px-4 py-3 text-sm font-semibold text-primary active:bg-muted"
      >
        <Plus className="h-4 w-4" />
        Add more from {canteenName}
      </Link>
    </section>
  )
}
