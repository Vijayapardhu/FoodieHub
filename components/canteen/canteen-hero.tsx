"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, MapPin, Phone, Star } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { FavoriteButton } from "@/components/menu/favorite-button"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { cn } from "@/lib/utils/cn"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]

/**
 * Header for a canteen page: photograph, then everything else beneath it.
 *
 * The name, description and status chips used to be absolutely positioned
 * inside the banner, which meant they were laid over a box of fixed aspect
 * ratio with overflow hidden. A canteen whose name wrapped to two lines, or
 * that had a description, simply had the bottom of its own information sliced
 * off — and the contact strip's negative margin covered whatever survived.
 *
 * Everything below the photo is now in normal flow, so the block grows with
 * its content instead of being cropped by it. The card still lifts into the
 * image to keep the two reading as one header.
 */
export function CanteenHero({ canteen }: { canteen: Canteen }) {
  const router = useRouter()

  const hasContact =
    canteen.address || canteen.contact_phone || canteen.google_maps_url

  return (
    <header className="-mx-4 sm:-mx-5">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted sm:aspect-[21/9] sm:rounded-2xl">
        {canteen.banner_url ? (
          <Image
            src={canteen.banner_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className={cn("object-cover", !canteen.is_open && "grayscale")}
          />
        ) : (
          <ImagePlaceholder type="canteen" size="xl" />
        )}

        {/* Only deep enough to keep the controls legible. The old full-height
            gradient existed to carry text that no longer sits here. */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-transform active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <FavoriteButton canteenId={canteen.id} />
        </div>
      </div>

      <div className="relative mx-4 -mt-8 rounded-2xl border border-border bg-card p-4 shadow-card sm:mx-0 sm:-mt-10">
        <div className="flex items-start gap-3">
          {canteen.logo_url ? (
            <span className="relative -mt-8 h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-card shadow-card">
              <Image
                src={canteen.logo_url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            {/* No truncation: a canteen's own name is the last thing that
                should be abbreviated on its own page. */}
            <h1 className="text-xl font-extrabold leading-tight tracking-tight text-foreground sm:text-2xl">
              {canteen.name}
            </h1>
            {canteen.description ? (
              <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">
                {canteen.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
              canteen.is_open
                ? "bg-success-soft text-success"
                : "bg-destructive-soft text-destructive"
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {canteen.is_open ? "Open now" : "Closed"}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
            {canteen.total_reviews > 0 ? (
              <>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {Number(canteen.rating).toFixed(1)}
                <span className="font-normal text-muted-foreground">
                  ({canteen.total_reviews})
                </span>
              </>
            ) : (
              <span className="font-semibold text-muted-foreground">
                Not rated yet
              </span>
            )}
          </span>

          {canteen.prep_minutes ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />~
              {canteen.prep_minutes} min
            </span>
          ) : null}
        </div>

        {hasContact ? (
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <div className="min-w-0 flex-1">
              {canteen.address ? (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-2">
                    {canteen.address}
                    {canteen.address_reference
                      ? ` · near ${canteen.address_reference}`
                      : ""}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Collect at the counter with your token
                </p>
              )}
            </div>

            {canteen.contact_phone ? (
              <a
                href={`tel:${canteen.contact_phone}`}
                aria-label="Call the canteen"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform active:scale-90"
              >
                <Phone className="h-4 w-4" />
              </a>
            ) : null}

            {canteen.google_maps_url ? (
              <a
                href={canteen.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in maps"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform active:scale-90"
              >
                <MapPin className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  )
}
