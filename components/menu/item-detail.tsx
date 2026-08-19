"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Clock, MapPin, Star, Store } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VegMark } from "@/components/ui/status-badge"
import { StarRating } from "@/components/ui/star-rating"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { canteenPath, cartPath, itemPath } from "@/lib/utils/public-id"
import { StickyBar } from "@/components/ui/sticky-bar"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { FavoriteButton } from "@/components/menu/favorite-button"
import { ShareItemButton } from "@/components/menu/share-item-button"
import { ItemCard } from "@/components/menu/item-card"
import { Section, SectionHeader } from "@/components/ui/section-header"
import { useCartItem } from "@/lib/hooks/use-cart-item"
import { cn } from "@/lib/utils/cn"

type Item = Database["public"]["Tables"]["items"]["Row"]
type Canteen = Database["public"]["Tables"]["canteens"]["Row"] | null

export interface ItemReviewRow {
  id: string
  rating: number
  comment: string | null
  photos: string[] | null
  created_at: string
  users: { full_name: string | null } | null
}

interface ItemDetailProps {
  item: Item
  canteen: Canteen
  relatedItems: Item[]
  /** Reviews of this dish, newest first. */
  reviews?: ItemReviewRow[]
  categoryName?: string | null
  /** Advertising slot, rendered by the server so an unsold one costs nothing. */
  promo?: React.ReactNode
}

export function ItemDetail({
  item,
  canteen,
  relatedItems,
  categoryName,
  promo,
  reviews = [],
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
  const [zoomed, setZoomed] = useState(false)
  /** Photos from a review, viewed in the same lightbox as the dish gallery. */
  const [reviewPhotos, setReviewPhotos] = useState<string[] | null>(null)
  const [reviewPhotoIndex, setReviewPhotoIndex] = useState(0)
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

  // Two different situations that used to share one disabled button. A dish
  // the kitchen has run out of cannot be ordered at all; a kitchen that is
  // shut can still take a booking, so the cart offers a time rather than
  // this page refusing outright.
  const soldOut = !item.is_available
  const canteenClosed = canteen?.is_open === false
  const orderable = !soldOut

  return (
    <>
      <div className="space-y-6">
        {/* Gallery runs edge to edge; the page hides the app bar for it */}
        <div className="-mx-4 sm:-mx-5">
          <div className="relative aspect-square w-full overflow-hidden bg-muted sm:aspect-[16/9] sm:rounded-2xl">
            {activeImage ? (
              // A photograph of food is the whole pitch, and on a phone the
              // thumbnail is the only view of it there is.
              <button
                type="button"
                onClick={() => setZoomed(true)}
                aria-label="View photo full screen"
                className="absolute inset-0 h-full w-full"
              >
                <Image
                  src={activeImage}
                  alt={item.name}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 720px"
                  className="object-cover"
                />
                {gallery.length > 1 ? (
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-2xs font-bold tabular-nums text-white backdrop-blur-sm">
                    {activeIndex + 1}/{gallery.length}
                  </span>
                ) : null}
              </button>
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
              <span className="flex items-center gap-2">
                <ShareItemButton
                  name={item.name}
                  canteenName={canteenName}
                  price={Number(item.price)}
                  path={itemPath(item)}
                />
                <FavoriteButton itemId={item.id} />
              </span>
            </div>

            {!item.is_available ? (
              // pointer-events-none: the badge must not swallow the tap that
              // opens the photo — a sold-out dish is still worth looking at.
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70">
                <span className="rounded-full bg-foreground/85 px-4 py-2 text-sm font-bold text-background">
                  Sold out
                </span>
              </span>
            ) : null}
          </div>

          {gallery.length > 1 ? (
            <div className="rail rail-inset mt-3">
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
                  <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-2.5">
          {/* Name first. It was the fourth thing on the page, under a row of
              badges — on a screen reached by tapping a photograph of the dish,
              the one thing worth reading first is what the dish is called. */}
          <div className="flex items-start gap-2.5">
            <VegMark vegetarian={item.is_vegetarian} className="mt-1.5" />
            <h1 className="min-w-0 flex-1 text-balance text-2xl font-extrabold leading-tight tracking-tight text-foreground">
              {item.name}
            </h1>
          </div>

          {/* Everything a decision actually turns on, in one line: what it
              costs, how long it takes, how it has been rated. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-2xl font-bold text-foreground">₹{Number(item.price)}</span>

            {item.prep_minutes ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />~{item.prep_minutes} min
              </span>
            ) : null}

            {item.total_reviews > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
                <Star className="h-3.5 w-3.5 fill-current" />
                {item.rating.toFixed(1)}
                <span className="font-normal opacity-80">({item.total_reviews})</span>
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                Not rated yet
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
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
            <span className="text-xs text-muted-foreground">incl. all taxes</span>
          </div>

          {item.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          ) : null}
        </div>

        {canteen ? (
          <Link
            href={canteenPath(canteen)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-transform active:scale-[0.99]"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-soft text-primary">
              {canteen.logo_url ? (
                <Image
                  src={canteen.logo_url}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <Store className="h-4 w-4" />
              )}
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
                <div key={key} className="rounded-xl border border-border bg-card p-3">
                  <dt className="text-xs capitalize text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-foreground">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </Section>
        ) : null}

        {/* What people who ate it said. The page has shown a star average
            since it was built, with nothing behind it to read. */}
        {reviews.length > 0 ? (
          <Section>
            <SectionHeader
              title="What people said"
              subtitle={`${item.total_reviews} ${
                item.total_reviews === 1 ? "rating" : "ratings"
              } for this dish`}
            />
            <ul className="space-y-2.5">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-2xl border border-border bg-card p-3.5">
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                      {review.users?.full_name || "A student"}
                    </span>
                    <span className="shrink-0 text-2xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {review.comment ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {review.comment}
                    </p>
                  ) : null}

                  {review.photos && review.photos.length > 0 ? (
                    <div className="mt-2 flex gap-2">
                      {review.photos.slice(0, 4).map((photo) => (
                        <button
                          key={photo}
                          type="button"
                          onClick={() => setReviewPhotos(review.photos ?? [])}
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted"
                          aria-label="View review photo"
                        >
                          <Image src={photo} alt="" fill sizes="56px" className="object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {/* After the dish is understood, before the alternatives to it. */}
        {promo}

        {relatedItems.length > 0 ? (
          <Section>
            <SectionHeader
              title="Goes well with"
              action={{
                label: "Full menu",
                href: canteenPath(canteen ?? { id: item.canteen_id }),
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
        {canteenClosed && !soldOut ? (
          <p className="mb-2 text-center text-xs font-medium text-warning">
            {canteenName} is closed — add it and choose a collection time in your cart.
          </p>
        ) : null}
        {orderable ? (
          quantity === 0 ? (
            // Same shape as the cart's action: amount on the left, what the
            // tap does on the right. It read as part of the page before —
            // one more full-width block among several rather than the thing
            // the screen exists for.
            <Button
              size="lg"
              block
              onClick={increment}
              className="animate-fade-in justify-between shadow-brand"
            >
              <span className="tabular-nums">₹{Number(item.price)}</span>
              <span>Add to cart</span>
            </Button>
          ) : (
            <div className="flex animate-fade-in items-center gap-3">
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
            Sold out
          </Button>
        )}
      </StickyBar>

      {reviewPhotos ? (
        <ImageLightbox
          images={reviewPhotos}
          index={reviewPhotoIndex}
          onIndexChange={setReviewPhotoIndex}
          onClose={() => {
            setReviewPhotos(null)
            setReviewPhotoIndex(0)
          }}
          alt={`Photo of ${item.name} from a review`}
        />
      ) : null}

      {zoomed ? (
        <ImageLightbox
          images={gallery}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setZoomed(false)}
          alt={item.name}
        />
      ) : null}
    </>
  )
}
