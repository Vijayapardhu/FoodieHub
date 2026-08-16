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

interface MenuItemRowProps {
  item: Item
  canteenId: string
  canteenName: string
  /** Public handle for the canteen, carried into the cart for its links. */
  canteenSlug?: string | null
  className?: string
}

/**
 * The menu list row. Text on the left, thumbnail plus the add control on the
 * right — a layout that stays scannable at phone widths where a photo grid
 * would push prices and names into two cramped columns.
 */
export function MenuItemRow({
  item,
  canteenId,
  canteenSlug,
  canteenName,
  className,
}: MenuItemRowProps) {
  const { quantity, increment, decrement } = useCartItem(
    item,
    canteenId,
    canteenName,
    canteenSlug
  )
  const unavailable = !item.is_available

  return (
    <li
      className={cn(
        "relative flex gap-3 border-b border-border py-4 last:border-b-0",
        unavailable && "opacity-60",
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <VegMark vegetarian={item.is_vegetarian} />

        <Link href={itemPath(item)} className="block">
          <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">
            {item.name}
          </h3>
        </Link>

        <p className="flex items-center gap-2 text-sm">
          <span className="font-bold text-foreground">₹{Number(item.price)}</span>
          {item.total_reviews > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-success">
              <Star className="h-3 w-3 fill-current" />
              {item.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">
                ({item.total_reviews})
              </span>
            </span>
          ) : null}
        </p>

        {item.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        ) : null}
      </div>

      <div className="relative w-28 shrink-0 sm:w-32">
        <Link
          href={itemPath(item)}
          className="relative block aspect-square w-full overflow-hidden rounded-xl bg-muted"
        >
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <ImagePlaceholder type="item" size="lg" />
          )}
          {unavailable ? (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs font-bold text-muted-foreground">
              Sold out
            </span>
          ) : null}
        </Link>

        <FavoriteButton
          itemId={item.id}
          size="sm"
          className="absolute right-1 top-1"
        />

        {/* Overlaps the image bottom edge, the way delivery apps anchor "Add" */}
        <div className="absolute inset-x-1 -bottom-3 flex justify-center">
          {unavailable ? null : quantity === 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={increment}
              className="h-9 w-full border-primary/40 bg-surface font-bold uppercase tracking-wide text-primary shadow-soft"
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
              className="w-full bg-surface shadow-soft"
            />
          )}
        </div>
      </div>
    </li>
  )
}
