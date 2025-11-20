"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Database } from "@/types/database.types"
import { MapPin, Phone, ExternalLink, Star } from "lucide-react"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]

interface CanteenHeroProps {
  canteen: Canteen
}

export function CanteenHero({ canteen }: CanteenHeroProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white/70 shadow-sm">
      <div className="relative h-56 w-full bg-orange-100">
        {canteen.banner_url ? (
          <Image
            src={canteen.banner_url}
            alt={canteen.name}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-1 items-end gap-4">
            {canteen.logo_url && (
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
                <Image
                  src={canteen.logo_url}
                  alt={`${canteen.name} logo`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
            <div className="text-white">
              <h1 className="text-3xl font-semibold">{canteen.name}</h1>
              <p className="text-sm text-white/80">
                {canteen.description || "Campus favourite with quick service"}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
                  <Star className="h-3.5 w-3.5 text-yellow-300" />
                  {Number(canteen.rating).toFixed(1)} · {canteen.total_reviews} reviews
                </span>
                <span
                  className={`inline-flex rounded-full px-3 py-1 ${canteen.is_open ? "bg-green-500/70" : "bg-red-500/70"}`}
                >
                  {canteen.is_open ? "Open now" : "Closed for the moment"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {canteen.contact_phone && (
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white/90 text-primary hover:bg-white"
              >
                <a href={`tel:${canteen.contact_phone}`} className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call kitchen
                </a>
              </Button>
            )}
            {canteen.google_maps_url && (
              <Button asChild size="lg" variant="outline" className="rounded-full bg-white/80">
                <Link href={canteen.google_maps_url} target="_blank" rel="noopener noreferrer">
                  <MapPin className="mr-2 h-4 w-4" />
                  View map
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-4 p-6 text-sm text-muted-foreground md:grid-cols-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span>
            {canteen.address || "Campus canteen"}{" "}
            {canteen.address_reference && (
              <em className="block text-xs text-muted-foreground">
                Landmark: {canteen.address_reference}
              </em>
            )}
          </span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Serving hours</p>
          <p className="font-medium text-foreground">
            {canteen.operating_hours
              ? "See schedule in app" // placeholder; could parse JSON later
              : "Mon - Sat · 9am - 9pm"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Highlights</p>
          <p className="font-medium text-foreground">
            Fast pickup · wallet payments · best for group combos
          </p>
        </div>
      </div>
    </section>
  )
}


