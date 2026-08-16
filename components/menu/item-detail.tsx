"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, MapPin, Store } from "lucide-react"
import { Database } from "@/types/database.types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VegMark } from "@/components/ui/status-badge"
import { StarRating } from "@/components/ui/star-rating"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { canteenPath, cartPath } from "@/lib/utils/public-id"
import { StickyBar } from "@/components/ui/sticky-bar"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { FavoriteButton } from "@/components/menu/favorite-button"
import { ItemCard } from "@/components/menu/item-card"
import { Section, SectionHeader } from "@/components/ui/section-header"
import { useCartItem } from "@/lib/hooks/use-cart-item"
import { cn } from "@/lib/utils/cn"

type Item = Database["public"]["Tables"]["items"]["Row"]
type Canteen = Database["public"]["Tables"]["canteens"]["Row"] | null

interface ItemDetailProps {
  item: Item
  canteen: Canteen
  relatedItems: Item[]
  categoryName?: string | null
}

export function ItemDetail({
  item,
  canteen,
  relatedItems,
  categoryName,
}: ItemDetailProps) {
  const router = useRouter()
  const canteenName = canteen?.name ?? "Canteen"

  const gallery = useMemo(() => {
    const sources = [
      item.featured_image_url,
      item.image_url,
      ...(item.gallery_images ?? []),
    ].filter(Boolean) as string[]
    return Array.from(new Set(sources))
  }, [item.featured_image_url, item.image_url, item.gallery_images])

  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = gallery[activeIndex] ?? null

  const { quantity, increment, decrement } = useCartItem(
    item,
    item.canteen_id,
    canteenName,
    canteen?.slug
  )

  const nutritionEntries =
    item.nutritional_info &&
    typeof item.nutritional_info === "object" &&
    !Array.isArray(item.nutritional_info)
      ? Object.entries(item.nutritional_info as Record<string, string | number>)
      : []

  const orderable = item.is_available && canteen?.is_open !== false

  return (
    <>
      <div className="space-y-6">
        {/* Gallery runs edge to edge; the page hides the app bar for it */}
        <div className="-mx-4 sm:-mx-5">
          <div className="relative aspect-square w-full overflow-hidden bg-muted sm:aspect-[16/9] sm:rounded-2xl">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={item.name}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 720px"
                className="object-cover"
              />
            ) : (
              <ImagePlaceholder type="item" size="xl" />
            )}

            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-transform active:scale-90"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <FavoriteButton itemId={item.id} />
            </div>

            {!item.is_available ? (
              <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                <span className="rounded-full bg-foreground/85 px-4 py-2 text-sm font-bold text-background">
                  Sold out
                </span>
              </span>
            ) : null}
          </div>

          {gallery.length > 1 ? (
            <div className="rail mt-3 px-4 sm:px-0">
              {gallery.map((src, idx) => (
                <button
                  key={`${src}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`View photo ${idx + 1}`}
                  aria-pressed={activeIndex === idx}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                    activeIndex === idx ? "border-primary" : "border-transparent"
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <VegMark vegetarian={item.is_vegetarian} withLabel />
            {categoryName ? (
              <Badge variant="muted" size="sm">
                {categoryName}
              </Badge>
            ) : null}
            {item.is_featured ? (
              <Badge variant="warning" size="sm">
                Chef&apos;s pick
              </Badge>
            ) : null}
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground text-balance">
            {item.name}
          </h1>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-2xl font-bold text-foreground">
              ₹{Number(item.price)}
            </p>
            <span className="text-xs text-muted-foreground">
              incl. all taxes
            </span>
            {item.total_reviews > 0 ? (
              <span className="flex items-center gap-1.5">
                <StarRating value={item.rating} />
                <span className="text-xs text-muted-foreground">
                  {item.rating.toFixed(1)} · {item.total_reviews} reviews
                </span>
              </span>
            ) : null}
          </div>

          {item.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          ) : null}
        </div>

        {canteen ? (
          <Link
            href={canteenPath(canteen)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-transform active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Store className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {canteen.name}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {canteen.address ? (
                  <>
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{canteen.address}</span>
                  </>
                ) : (
                  <span>{canteen.is_open ? "Open now" : "Closed"}</span>
                )}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ) : null}

        {nutritionEntries.length > 0 ? (
          <Section>
            <SectionHeader title="Nutrition" />
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {nutritionEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <dt className="text-xs capitalize text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-foreground">
                    {String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        ) : null}

        {relatedItems.length > 0 ? (
          <Section>
            <SectionHeader
              title="Goes well with"
              action={{
                label: "Full menu",
                href: canteenPath(
                  canteen ?? { id: item.canteen_id }
                ),
              }}
            />
            <div className="rail">
              {relatedItems.map((related) => (
                <ItemCard
                  key={related.id}
                  item={related}
                  canteenId={related.canteen_id}
                  canteenName={canteenName}
                  compact
                />
              ))}
            </div>
          </Section>
        ) : null}
      </div>

      <StickyBar>
        {orderable ? (
          quantity === 0 ? (
            <Button size="lg" block onClick={increment}>
              Add to cart · ₹{Number(item.price)}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <QuantityStepper
                size="lg"
                quantity={quantity}
                onIncrement={increment}
                onDecrement={decrement}
                removeAtOne
                label={item.name}
              />
              <Button size="lg" className="flex-1" asChild>
                <Link href={cartPath(canteen ?? { id: item.canteen_id })}>
                  View cart · ₹{(Number(item.price) * quantity).toFixed(0)}
                </Link>
              </Button>
            </div>
          )
        ) : (
          <Button size="lg" block disabled>
            {item.is_available ? "Canteen is closed" : "Sold out"}
          </Button>
        )}
      </StickyBar>
    </>
  )
}
