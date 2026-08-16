"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Plus } from "lucide-react"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { useCartStore } from "@/store/cart-store"
import { Skeleton } from "@/components/ui/skeleton"
import { VegMark } from "@/components/ui/status-badge"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"

type Item = Database["public"]["Tables"]["items"]["Row"] & {
  categories: { name: string } | null
}

/**
 * "Complete your meal" rail.
 *
 * The cheapest way to raise average order value: someone who has already
 * decided to buy is far more likely to add a ₹15 chai than a new visitor is to
 * order at all. Suggestions are cheap add-ons from the same canteen, so the
 * kitchen still prepares one order and the student still collects one token.
 */
export function CartUpsell({
  canteenId,
  canteenName,
}: {
  canteenId: string
  canteenName: string
}) {
  const [suggestions, setSuggestions] = useState<Item[] | null>(null)
  const cartItemIds = useCartStore((state) =>
    state.items.map((item) => item.itemId).join(",")
  )
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("items")
          .select("*, categories(name)")
          .eq("canteen_id", canteenId)
          .eq("is_available", true)
          // Cheap items only: an add-on should feel like a rounding error, not
          // a second meal.
          .lte("price", 60)
          .order("rating", { ascending: false })
          .limit(12)

        if (error) throw error
        if (!cancelled) setSuggestions(data ?? [])
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [canteenId])

  if (suggestions === null) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-24 w-32 rounded-xl" />
          <Skeleton className="h-24 w-32 rounded-xl" />
          <Skeleton className="h-24 w-32 rounded-xl" />
        </div>
      </div>
    )
  }

  const inCart = new Set(cartItemIds.split(",").filter(Boolean))
  const visible = suggestions.filter((item) => !inCart.has(item.id)).slice(0, 8)

  if (visible.length === 0) return null

  return (
    <section className="space-y-2.5 rounded-2xl border border-border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          Complete your meal
        </h2>
        <p className="text-xs text-muted-foreground">
          Popular add-ons from {canteenName}
        </p>
      </div>

      <ul className="rail">
        {visible.map((item) => (
          <li
            key={item.id}
            className="w-32 shrink-0 overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="relative aspect-square w-full bg-muted">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt=""
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <ImagePlaceholder type="item" size="md" />
              )}
            </div>

            <div className="space-y-1 p-2">
              <VegMark vegetarian={item.is_vegetarian} />
              <p className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">
                {item.name}
              </p>

              <button
                type="button"
                onClick={() =>
                  addItem({
                    itemId: item.id,
                    name: item.name,
                    price: Number(item.price),
                    imageUrl: item.image_url,
                    canteenId,
                    canteenName,
                  })
                }
                className="flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-primary-soft text-xs font-bold text-primary transition-transform active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />₹{Number(item.price)}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
