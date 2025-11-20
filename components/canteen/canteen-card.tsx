import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Star, Phone, MapPin } from "lucide-react"
import { Database } from "@/types/database.types"
import { FavoriteButton } from "@/components/menu/favorite-button"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]

interface CanteenCardProps {
  canteen: Canteen
}

export function CanteenCard({ canteen }: CanteenCardProps) {
  const operatingHours = canteen.operating_hours as Record<string, any>

  return (
    <div className="relative">
      <Link href={`/canteen/${canteen.id}`}>
        <Card className="overflow-hidden rounded-3xl border-0 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div className="relative h-44 w-full">
            {canteen.banner_url ? (
              <Image
                src={canteen.banner_url}
                alt={canteen.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
            {canteen.logo_url && (
              <div className="absolute -bottom-6 left-6">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
                  <Image
                    src={canteen.logo_url}
                    alt={canteen.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
          <CardContent className="pt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{canteen.name}</h3>
              <div className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-primary">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {canteen.rating.toFixed(1)}
              </div>
            </div>
            {canteen.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {canteen.description}
              </p>
            )}
            {canteen.address && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{canteen.address}</span>
              </p>
            )}
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span
                  className={canteen.is_open ? "text-success" : "text-destructive"}
                >
                  {canteen.is_open ? "Open now" : "Closed"}
                </span>
              </div>
              {canteen.contact_phone && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  Tap to call
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
      <div className="absolute right-4 top-4 z-10">
        <FavoriteButton canteenId={canteen.id} />
      </div>
    </div>
  )
}

