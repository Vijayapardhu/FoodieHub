import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Star, MapPin } from "lucide-react"
import { Database } from "@/types/database.types"
import { FavoriteButton } from "@/components/menu/favorite-button"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]

interface CanteenCardProps {
  canteen: Canteen
}

export function CanteenCard({ canteen }: CanteenCardProps) {
  return (
    <div className="relative group">
      <Link href={`/canteen/${canteen.id}`}>
        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
          {/* Banner Image */}
          <div className="relative h-48 w-full">
            {canteen.banner_url ? (
              <Image
                src={canteen.banner_url}
                alt={canteen.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-orange-50" />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
            
            {/* Logo */}
            {canteen.logo_url && (
              <div className="absolute -bottom-8 left-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg">
                  <Image
                    src={canteen.logo_url}
                    alt={canteen.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* Rating Badge */}
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 shadow-md">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-foreground">{canteen.rating.toFixed(1)}</span>
            </div>
          </div>

          <CardContent className="pt-10 pb-4 px-4">
            {/* Name and Status */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-foreground pr-2">{canteen.name}</h3>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                canteen.is_open 
                  ? "bg-green-50 text-green-700" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                <Clock className={`h-3 w-3 ${canteen.is_open ? "text-green-600" : "text-gray-500"}`} />
                {canteen.is_open ? "Open" : "Closed"}
              </div>
            </div>

            {/* Description */}
            {canteen.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {canteen.description}
              </p>
            )}

            {/* Address */}
            {canteen.address && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{canteen.address}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
      
      {/* Favorite Button */}
      <div className="absolute right-4 top-4 z-10">
        <FavoriteButton canteenId={canteen.id} />
      </div>
    </div>
  )
}