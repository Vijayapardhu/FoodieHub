"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Star } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { canteenPath } from "@/lib/utils/public-id"
import { cn } from "@/lib/utils/cn"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]

/**
 * A canteen, sold the way a canteen should be sold: by its photograph.
 *
 * The old card led with a name and a rating chip, which is a directory entry.
 * This leads with a 16:10 photo and puts everything else underneath, because
 * on a campus the thing that makes somebody choose one counter over another
 * is what the food looks like — the name is something they already know.
 *
 * No distance and no delivery time: everything here is a short walk, and
 * pretending otherwise would make this a delivery app it isn't.
 */
export function CanteenRailCard({
  canteen,
  cuisines,
  className,
}: {
  canteen: Canteen
  /** Categories this canteen actually cooks, derived from its menu. */
  cuisines?: string[]
  className?: string
}) {
  const image = canteen.banner_url ?? canteen.logo_url
  const closed = !canteen.is_open
  const prep = canteen.prep_minutes

  return (
    <Link
      href={canteenPath(canteen)}
      className={cn(
        "group w-card-canteen max-w-[85vw] shrink-0 overflow-hidden rounded-2xl",
        className
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 85vw, 350px"
            className={cn(
              "object-cover transition-transform duration-500 md:group-hover:scale-[1.04]",
              closed && "grayscale"
            )}
          />
        ) : (
          <ImagePlaceholder type="canteen" size="lg" />
        )}

        <span
          className={cn(
            "absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-2xs font-bold backdrop-blur-sm",
            closed
              ? "bg-background/85 text-muted-foreground"
              : "bg-success text-success-foreground"
          )}
        >
          {closed ? "Closed" : "Open now"}
        </span>

        {prep ? (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-2xs font-bold text-foreground backdrop-blur-sm">
            <Clock className="h-3 w-3" />
            ~{prep} min
          </span>
        ) : null}
      </div>

      <div className="px-0.5 pt-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-bold text-foreground">
            {canteen.name}
          </h3>
          {canteen.total_reviews > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-success-soft px-1.5 py-0.5 text-2xs font-bold text-success">
              <Star className="h-3 w-3" />
              {Number(canteen.rating).toFixed(1)}
            </span>
          ) : (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-2xs font-semibold text-muted-foreground">
              New
            </span>
          )}
        </div>

        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {cuisines && cuisines.length > 0
            ? cuisines.slice(0, 3).join(" · ")
            : canteen.description || "Campus canteen"}
        </p>
      </div>
    </Link>
  )
}
