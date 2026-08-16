"use client"

import Image from "next/image"
import Link from "next/link"
import { Store, Trash2 } from "@/components/ui/icons"
import { CartItem, useCartStore } from "@/store/cart-store"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { canteenPath, itemPath } from "@/lib/utils/public-id"

/** One canteen's worth of cart lines. Each canteen becomes its own order. */
export function CartGroup({
  canteenId,
  canteenName,
  items,
}: {
  canteenId: string
  canteenName: string
  items: CartItem[]
}) {
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Store className="h-4 w-4" />
        </span>
        <Link
          href={canteenPath({ id: canteenId, slug: items[0]?.canteenSlug })}
          className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground"
        >
          {canteenName}
        </Link>
        <span className="text-sm font-bold tabular-nums text-foreground">
          ₹{subtotal.toFixed(2)}
        </span>
      </header>

      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.itemId} className="flex items-center gap-3 p-3.5">
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
                  className="object-cover"
                />
              ) : (
                <ImagePlaceholder type="item" size="md" />
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <Link href={itemPath({ id: item.itemId, slug: item.itemSlug })}>
                <p className="line-clamp-2 text-sm font-semibold text-foreground">
                  {item.name}
                </p>
              </Link>
              <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                ₹{item.price.toFixed(2)} each
              </p>
              <p className="text-sm font-bold tabular-nums text-foreground">
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
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
              <button
                type="button"
                onClick={() => removeItem(item.itemId)}
                className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
