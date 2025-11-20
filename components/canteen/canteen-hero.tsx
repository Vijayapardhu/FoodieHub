"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Database } from "@/types/database.types"
import { MapPin, Phone, ExternalLink, Star, Clock, Award } from "lucide-react"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]

interface CanteenHeroProps {
  canteen: Canteen
}

export function CanteenHero({ canteen }: CanteenHeroProps) {
  return (
    <section className="mb-8 overflow-hidden rounded-3xl border-0 bg-white shadow-lg shadow-orange-100/50">
      {/* Hero Banner */}
      <div className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-orange-100 via-primary/20 to-orange-50">
        {canteen.banner_url ? (
          <Image
            src={canteen.banner_url}
            alt={canteen.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-orange-100/50 to-primary/10" />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Logo and Info Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-1 items-end gap-4">
                {canteen.logo_url && (
                  <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl ring-4 ring-white/20">
                    <Image
                      src={canteen.logo_url}
                      alt={`${canteen.name} logo`}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}
                <div className="text-white">
                  <h1 className="text-4xl font-bold drop-shadow-lg md:text-5xl">
                    {canteen.name}
                  </h1>
                  <p className="mt-1 text-base text-white/90 drop-shadow-md">
                    {canteen.description || "Campus favourite with quick service"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold">
                      <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                      {Number(canteen.rating).toFixed(1)}
                      <span className="text-white/70">
                        ({canteen.total_reviews} {canteen.total_reviews === 1 ? "review" : "reviews"})
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold backdrop-blur-sm ${
                        canteen.is_open
                          ? "bg-green-500/90 text-white"
                          : "bg-red-500/90 text-white"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      {canteen.is_open ? "Open now" : "Closed"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {canteen.contact_phone && (
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-white text-primary shadow-lg hover:bg-orange-50 hover:shadow-xl transition-all"
                  >
                    <a href={`tel:${canteen.contact_phone}`} className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="hidden sm:inline">Call kitchen</span>
                      <span className="sm:hidden">Call</span>
                    </a>
                  </Button>
                )}
                {canteen.google_maps_url && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full bg-white/90 backdrop-blur-sm border-white/50 text-gray-800 hover:bg-white hover:shadow-lg transition-all"
                  >
                    <Link href={canteen.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="hidden sm:inline">View map</span>
                      <span className="sm:hidden">Map</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid gap-6 border-t border-orange-50 bg-gradient-to-b from-white to-orange-50/30 p-6 md:grid-cols-3">
        {canteen.address && (
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Location
              </p>
              <p className="mt-1 font-medium text-foreground">
                {canteen.address}
              </p>
              {canteen.address_reference && (
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium">Landmark:</span> {canteen.address_reference}
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Serving Hours
            </p>
            <p className="mt-1 font-medium text-foreground">
              {canteen.operating_hours
                ? "Check app for schedule"
                : "Mon - Sat · 9am - 9pm"}
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Highlights
            </p>
            <p className="mt-1 font-medium text-foreground">
              Fast pickup · Quick service · Best combos
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}


