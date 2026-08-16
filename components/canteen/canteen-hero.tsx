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
 * Immersive header for a canteen page. The banner runs under the status bar and
 * carries its own back button, so the page can skip the standard app bar and
 * give the photo the full width of the screen.
 */
export function CanteenHero({ canteen }: { canteen: Canteen }) {
  const router = useRouter()

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

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35" />

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

        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
          <div className="flex items-end gap-3">
            {canteen.logo_url ? (
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white/90 bg-white">
                <Image
                  src={canteen.logo_url}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </span>
            ) : null}

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white drop-shadow">
                {canteen.name}
              </h1>
              {canteen.description ? (
                <p className="line-clamp-1 text-sm text-white/85">
                  {canteen.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
              {canteen.total_reviews > 0 ? (
                <>
                  <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                  {Number(canteen.rating).toFixed(1)}
                  <span className="font-normal text-white/70">
                    ({canteen.total_reviews})
                  </span>
                </>
              ) : (
                <span>Not rated yet</span>
              )}
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md",
                canteen.is_open ? "bg-success/90" : "bg-destructive/90"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {canteen.is_open ? "Open now" : "Closed"}
            </span>
          </div>
        </div>
      </div>

      {/* Contact strip: both actions are one tap on a phone */}
      {canteen.address || canteen.contact_phone || canteen.google_maps_url ? (
        <div className="mx-4 -mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card sm:mx-0 sm:mt-3">
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
    </header>
  )
}
