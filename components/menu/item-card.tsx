"use client"

import Image from "next/image"
import Link from "next/link"
import { Star } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { Button } from "@/components/ui/button"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { VegMark } from "@/components/ui/status-badge"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { FavoriteButton } from "@/components/menu/favorite-button"
import { useCartItem } from "@/lib/hooks/use-cart-item"
import { cn } from "@/lib/utils/cn"
import { itemPath } from "@/lib/utils/public-id"

type Item = Database["public"]["Tables"]["items"]["Row"]

interface ItemCardProps {
  item: Item
  canteenId: string
  canteenName: string
  /** Public handle for the canteen, carried into the cart for its links. */
  canteenSlug?: string | null
  /** Fixed-width variant for horizontal rails. */
  compact?: boolean
  /** Shown under the item name when the card appears outside its own canteen. */
  subtitle?: string
  className?: string
}

/** Poster-style card for featured rails and grids. */
export function ItemCard({
  item,
  canteenId,
  canteenSlug,
  canteenName,
  compact = false,
  subtitle,
  className,
}: ItemCardProps) {
  const { quantity, increment, decrement } = useCartItem(
    item,
    canteenId,
    canteenName,
    canteenSlug
  )
  const unavailable = !item.is_available
  const image = item.featured_image_url || item.image_url

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card",
        compact && "w-44 shrink-0 sm:w-52",
        unavailable && "opacity-60",
        className
      )}
    >
      <Link
        href={itemPath(item)}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
      >
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, 220px"
            className="object-cover transition-transform duration-300 md:group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder type="item" size="lg" />
        )}

        {unavailable ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs font-bold text-muted-foreground">
            Sold out
          </span>
        ) : null}

        {/* Brand green, not --warning: amber on a photo reads as the old
            orange palette, and "featured" is a promotion, not a caution. */}
        {item.is_featured && !unavailable ? (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-2xs font-bold text-primary-foreground">
            Featured
          </span>
        ) : null}
      </Link>

      <FavoriteButton
        itemId={item.id}
        size="sm"
        className="absolute right-2 top-2"
      />

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <VegMark vegetarian={item.is_vegetarian} />

        <Link href={itemPath(item)}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {item.name}
          </h3>
        </Link>

        {subtitle ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-base font-bold text-foreground">
            ₹{Number(item.price)}
          </span>
          {item.total_reviews > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-success">
              <Star className="h-3 w-3 fill-current" />
              {item.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        {unavailable ? null : quantity === 0 ? (
          <Button
            size="sm"
            variant="soft"
            block
            onClick={increment}
            className="mt-1 font-bold uppercase tracking-wide"
          >
            Add
          </Button>
        ) : (
          <QuantityStepper
            size="sm"
            quantity={quantity}
            onIncrement={increment}
            onDecrement={decrement}
            removeAtOne
            label={item.name}
            className="mt-1 w-full"
          />
        )}
      </div>
    </article>
  )
}
