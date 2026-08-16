"use client"

import { useRouter } from "next/navigation"
import { RotateCcw } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { cartPath } from "@/lib/utils/public-id"

export interface UsualOrder {
  orderId: string
  canteenId: string
  canteenSlug: string | null
  canteenName: string
  total: number
  placedAt: string
  items: Array<{
    itemId: string
    itemSlug: string | null
    name: string
    price: number
    imageUrl: string | null
    quantity: number
    available: boolean
  }>
}

/**
 * "Order it again" — the cheapest repeat purchase in the product.
 *
 * A returning student already knows what they want; making them rebuild the
 * cart from scratch is pure friction. One tap refills it and drops them at
 * checkout.
 */
export function ReorderRail({ usual }: { usual: UsualOrder }) {
  const router = useRouter()

  const orderAgain = () => {
    const { addItem, items, removeItem } = useCartStore.getState()

    // Replace this canteen's lines so repeated taps don't stack quantities.
    items
      .filter((item) => item.canteenId === usual.canteenId)
      .forEach((item) => removeItem(item.itemId))

    const available = usual.items.filter((item) => item.available)

    if (available.length === 0) {
      toast.error("Nothing from that order is available right now")
      return
    }

    for (const line of available) {
      for (let i = 0; i < line.quantity; i++) {
        addItem({
          itemId: line.itemId,
          name: line.name,
          price: line.price,
          imageUrl: line.imageUrl,
          canteenId: usual.canteenId,
          canteenName: usual.canteenName,
          itemSlug: line.itemSlug,
          canteenSlug: usual.canteenSlug,
        })
      }
    }

    const skipped = usual.items.length - available.length
    toast.success(
      skipped > 0
        ? `Added · ${skipped} item${skipped === 1 ? "" : "s"} unavailable`
        : "Added to cart"
    )
    router.push(cartPath({ id: usual.canteenId, slug: usual.canteenSlug }))
  }

  const summary = usual.items
    .map((item) => (item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name))
    .join(", ")

  return (
    // Two lines rather than three. This sits directly under the banner and is
    // a shortcut, not a section — the canteen and the total belong on the same
    // line as the dishes, at the weight of a caption.
    <section className="flex items-center gap-3 rounded-2xl bg-primary-soft px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-bold uppercase tracking-wider text-primary">Your usual</p>
        <p className="line-clamp-1 text-sm font-semibold text-foreground">
          {summary}
          <span className="font-normal text-muted-foreground">
            {" · "}
            {usual.canteenName} · ₹{usual.total.toFixed(0)}
          </span>
        </p>
      </div>

      <Button onClick={orderAgain} className="h-9 shrink-0 rounded-xl px-3.5">
        <RotateCcw className="h-4 w-4" />
        Again
      </Button>
    </section>
  )
}
