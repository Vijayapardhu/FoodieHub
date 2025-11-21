"use client"

import { useMemo, useState } from "react"
import { Search, Flame, Sparkles, UtensilsCrossed } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Database } from "@/types/database.types"
import { CanteenCard } from "@/components/canteen/canteen-card"
import { Skeleton } from "@/components/ui/loading-state"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]
type Item = Database["public"]["Tables"]["items"]["Row"] & {
  canteens: { name: string } | null
}
type Category = Database["public"]["Tables"]["categories"]["Row"]

interface HomePageContentProps {
  canteens: Canteen[]
  featuredItems: Item[]
  categories: Category[]
}

export function HomePageContent({
  canteens,
  featuredItems,
  categories,
}: HomePageContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  const filteredCanteens = useMemo(() => {
    const bySearch = searchQuery
      ? canteens.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : canteens

    if (activeFilter === "trending") {
      return bySearch.slice().sort((a, b) => b.rating - a.rating)
    }

    if (activeFilter === "new") {
      return bySearch
        .slice()
        .sort((a, b) =>
          (b.created_at || "").localeCompare(a.created_at || "")
        )
    }

    return bySearch
  }, [canteens, searchQuery, activeFilter])

  const showGlobalPlaceholder =
    canteens.length === 0 && featuredItems.length === 0 && categories.length === 0

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Welcome Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Discover Amazing Food
          </h1>
          <p className="text-muted-foreground">
            Explore canteens and order your favorite meals
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search canteens, items, or dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-xl border-gray-200 bg-white pl-11 pr-4 shadow-sm focus:border-primary focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { key: "all", label: "All" },
            { key: "trending", label: "Trending", icon: Flame },
            { key: "new", label: "New", icon: Sparkles },
          ].map((filter) => {
            const Icon = filter.icon
            const isActive = activeFilter === filter.key
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-orange-400 text-white shadow-lg shadow-primary/25 scale-105"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Featured Banner */}
      {featuredItems.length > 0 && (
        <Link href={`/items/${featuredItems[0].id}`}>
          <div className="group relative overflow-hidden rounded-2xl cursor-pointer transition-transform hover:scale-[1.01]">
            <div className="relative h-56 w-full bg-gradient-to-br from-orange-100 via-primary/10 to-orange-50">
              {featuredItems[0].image_url ? (
                <Image
                  src={featuredItems[0].image_url}
                  alt={featuredItems[0].name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-3 py-1 rounded-full bg-primary/90 backdrop-blur-sm text-xs font-semibold">
                    Featured
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-1">{featuredItems[0].name}</h2>
                <p className="text-white/80 text-sm">{featuredItems[0].canteens?.name}</p>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Categories</h2>
            <span className="text-sm text-muted-foreground">Browse by type</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/home?category=${category.id}`}
                className="group flex min-w-[120px] flex-col items-center gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-orange-100 transition-transform group-hover:scale-110">
                  <UtensilsCrossed className="h-6 w-6 text-primary/70" />
                </div>
                <span className="text-sm font-semibold text-foreground">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Items */}
      {featuredItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Featured Items</h2>
            <Link
              href="/favorites"
              className="text-sm font-medium text-primary hover:underline"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featuredItems.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="group"
              >
                <Card className="overflow-hidden rounded-xl border-0 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="relative h-40 w-full bg-gray-100">
                    {item.featured_image_url || item.image_url ? (
                      <Image
                        src={item.featured_image_url || item.image_url!}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <ImagePlaceholder type="item" size="xl" />
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="line-clamp-1 font-semibold text-foreground text-sm">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.canteens?.name}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <p className="font-bold text-primary">₹{item.price}</p>
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-primary">
                        Featured
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Canteens */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">All Canteens</h2>
          <span className="text-sm text-muted-foreground">
            {filteredCanteens.length} {filteredCanteens.length === 1 ? "canteen" : "canteens"}
          </span>
        </div>
        
        {filteredCanteens.length === 0 ? (
          showGlobalPlaceholder ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-dashed border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-muted-foreground">
                {canteens.length === 0
                  ? "No canteens available yet. Check back soon!"
                  : "No canteens match your search. Try a different term."}
              </p>
            </Card>
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCanteens.map((canteen) => (
              <CanteenCard key={canteen.id} canteen={canteen} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}