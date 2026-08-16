import Link from "next/link"
import Image from "next/image"
import { Clock, MapPin, Star } from "lucide-react"
import { Database } from "@/types/database.types"
import { FavoriteButton } from "@/components/menu/favorite-button"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { cn } from "@/lib/utils/cn"
import { canteenPath } from "@/lib/utils/public-id"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]

interface CanteenCardProps {
  canteen: Canteen
  className?: string
  /** Fixed-width variant for horizontal rails. */
  compact?: boolean
}

export function CanteenCard({ canteen, className, compact }: CanteenCardProps) {
  const closed = !canteen.is_open

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card",
        "transition-transform duration-150 ease-spring active:scale-[0.99] md:hover:shadow-lift",
        compact && "w-64 shrink-0",
        className
      )}
    >
      <Link href={canteenPath(canteen)} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {canteen.banner_url ? (
            <Image
              src={canteen.banner_url}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={cn(
                "object-cover transition-transform duration-300 md:group-hover:scale-105",
                closed && "grayscale"
              )}
            />
          ) : (
            <ImagePlaceholder type="canteen" size="xl" />
          )}

          {/* Keeps the rating chip readable over any photo */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />

          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {canteen.rating.toFixed(1)}
            <span className="font-normal text-white/70">
              ({canteen.total_reviews})
            </span>
          </span>

          {closed ? (
            <span className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
              <span className="rounded-full bg-foreground/85 px-3 py-1.5 text-xs font-bold text-background">
                Closed right now
              </span>
            </span>
          ) : null}
        </div>

        <div className="space-y-1.5 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 flex-1 text-base font-bold tracking-tight text-foreground">
              {canteen.name}
            </h3>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold",
                canteen.is_open
                  ? "bg-success-soft text-success"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Clock className="h-3 w-3" />
              {canteen.is_open ? "Open" : "Closed"}
            </span>
          </div>

          {canteen.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {canteen.description}
            </p>
          ) : null}

          {canteen.address ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{canteen.address}</span>
            </p>
          ) : null}
        </div>
      </Link>

      {/* Sits outside the Link so tapping it doesn't navigate */}
      <div className="absolute right-2 top-2">
        <FavoriteButton canteenId={canteen.id} />
      </div>
    </article>
  )
}
