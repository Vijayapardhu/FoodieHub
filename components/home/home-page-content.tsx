"use client"

import { useMemo, useState } from "react"
import { Search, Bell, MessageCircle, Flame } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Database } from "@/types/database.types"
import { CanteenCard } from "@/components/canteen/canteen-card"
import { Skeleton } from "@/components/ui/loading-state"

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
    <div className="container mx-auto px-4 py-6">
      {/* Hero + Search */}
      <div className="mb-6 space-y-4">
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for 'North canteen' or 'chai'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-2xl border border-orange-100 bg-white/80 pl-10 pr-4 shadow-sm focus:border-primary"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-2xl border border-orange-100 bg-white/80 shadow-sm"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-2xl border border-orange-100 bg-white/80 shadow-sm"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {[
              { key: "all", label: "All" },
              { key: "trending", label: "Trending" },
              { key: "new", label: "New this week" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition ${
                  activeFilter === filter.key
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-muted-foreground"
                }`}
              >
                {filter.key === "trending" && <Flame className="h-4 w-4" />}
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Image/Banner */}
      {featuredItems.length > 0 ? (
        <div className="mb-6 overflow-hidden rounded-3xl">
          <div className="relative h-64 w-full bg-gradient-to-br from-orange-100 to-primary/10">
            {featuredItems[0].image_url ? (
              <Image
                src={featuredItems[0].image_url}
                alt={featuredItems[0].name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-primary">
                    {featuredItems[0].name}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {featuredItems[0].canteens?.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : showGlobalPlaceholder ? (
        <Skeleton className="mb-6 h-48 rounded-2xl" />
      ) : (
        <Card className="mb-6 rounded-3xl border border-dashed border-orange-200 bg-white/70 p-6 text-center text-sm text-muted-foreground">
          Add a featured item to highlight it here.
        </Card>
      )}

      {/* Categories */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="mb-3 text-xl font-semibold">Categories</h2>
          <span className="text-sm text-muted-foreground">
            Pick a vibe for your meal
          </span>
        </div>
        {categories.length === 0 ? (
          showGlobalPlaceholder ? (
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-32 min-w-[100px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border border-dashed border-orange-200 bg-white/70 p-6 text-center text-sm text-muted-foreground">
              Categories will appear once the admin creates them.
            </Card>
          )
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/home?category=${category.id}`}
                className="flex min-w-[120px] flex-col items-center gap-2 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-orange-50 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-orange-100 shadow-inner">
                  <span className="text-xl">🍽️</span>
                </div>
                <span className="text-sm font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Featured Items */}
      {featuredItems.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="mb-3 text-xl font-semibold">Featured Items</h2>
            <Link
              href="/favorites"
              className="text-sm font-medium text-primary hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {featuredItems.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/canteen/${item.canteen_id}`}
                className="group"
              >
                <Card className="overflow-hidden rounded-3xl border-0 bg-white/80 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-32 w-full bg-muted">
                    {item.featured_image_url || item.image_url ? (
                      <Image
                        src={item.featured_image_url || item.image_url!}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <span className="text-4xl">🍔</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-1 p-4">
                    <h3 className="line-clamp-1 font-semibold">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.canteens?.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-primary">₹{item.price}</p>
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-primary">
                        chef pick
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
      <div>
        <div className="flex items-center justify-between">
          <h2 className="mb-3 text-xl font-semibold">All Canteens</h2>
          <button className="text-sm text-primary hover:underline">
            View map
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCanteens.map((canteen) => (
            <CanteenCard key={canteen.id} canteen={canteen} />
          ))}
        </div>
        {filteredCanteens.length === 0 &&
          (showGlobalPlaceholder ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              {canteens.length === 0
                ? "No canteens available yet. Check back soon!"
                : "No canteens match your search."}
            </div>
          ))}
      </div>
    </div>
  )
}

