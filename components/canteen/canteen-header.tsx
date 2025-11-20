import Image from "next/image"
import { Clock, Star, Phone, MapPin, ExternalLink } from "lucide-react"
import { Database } from "@/types/database.types"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]

interface CanteenHeaderProps {
  canteen: Canteen
}

export function CanteenHeader({ canteen }: CanteenHeaderProps) {
  return (
    <div className="relative h-64 w-full overflow-hidden">
      {canteen.banner_url ? (
        <Image
          src={canteen.banner_url}
          alt={canteen.name}
          fill
          className="object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="container">
          <div className="flex items-end gap-4">
            {canteen.logo_url && (
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-background shadow-lg">
                <Image
                  src={canteen.logo_url}
                  alt={canteen.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{canteen.name}</h1>
              {canteen.description && (
                <p className="mt-1 text-muted-foreground">
                  {canteen.description}
                </p>
              )}
              {canteen.address && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/80">
                  <MapPin className="h-4 w-4" />
                  <span>{canteen.address}</span>
                  {canteen.google_maps_url && (
                    <a
                      href={canteen.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs underline"
                    >
                      View map
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
              {canteen.address_reference && (
                <p className="text-xs text-white/80">
                  Landmark: {canteen.address_reference}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {canteen.rating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({canteen.total_reviews})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span
                    className={
                      canteen.is_open ? "text-success" : "text-destructive"
                    }
                  >
                    {canteen.is_open ? "Open" : "Closed"}
                  </span>
                </div>
                {canteen.contact_phone ? (
                  <a
                    href={`tel:${canteen.contact_phone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-primary shadow-sm transition hover:bg-white"
                  >
                    <Phone className="h-4 w-4" />
                    Call canteen
                  </a>
                ) : (
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white/80">
                    Contact info coming soon
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

