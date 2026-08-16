"use client"

import { useMemo, useState } from "react"
import { Heart } from "lucide-react"
import { Database } from "@/types/database.types"
import { Chip, ChipRail } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { CardGridSkeleton } from "@/components/ui/loading-state"
import { ItemCard } from "@/components/menu/item-card"
import { CanteenCard } from "@/components/canteen/canteen-card"

type Favorite = Database["public"]["Tables"]["favorites"]["Row"] & {
  items:
    | (Database["public"]["Tables"]["items"]["Row"] & {
        canteens: { name: string } | null
      })
    | null
  canteens: Database["public"]["Tables"]["canteens"]["Row"] | null
}

type Filter = "all" | "dishes" | "canteens"

export function FavoritesList({
  favorites,
  loading,
}: {
  favorites: Favorite[]
  loading?: boolean
}) {
  const [filter, setFilter] = useState<Filter>("all")

  const { dishes, canteens } = useMemo(
    () => ({
      dishes: favorites.filter((f) => f.items),
      canteens: favorites.filter((f) => !f.items && f.canteens),
    }),
    [favorites]
  )

  if (loading) return <CardGridSkeleton count={6} />

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Nothing saved yet"
        description="Tap the heart on any dish or canteen and it'll wait for you here."
        action={{ label: "Browse canteens", href: "/home" }}
      />
    )
  }

  const showDishes = filter === "all" || filter === "dishes"
  const showCanteens = filter === "all" || filter === "canteens"

  return (
    <div className="space-y-5">
      <ChipRail>
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          All ({favorites.length})
        </Chip>
        <Chip active={filter === "dishes"} onClick={() => setFilter("dishes")}>
          Dishes ({dishes.length})
        </Chip>
        <Chip
          active={filter === "canteens"}
          onClick={() => setFilter("canteens")}
        >
          Canteens ({canteens.length})
        </Chip>
      </ChipRail>

      {showDishes && dishes.length > 0 ? (
        <section className="space-y-3">
          {filter === "all" ? <h2 className="section-title">Dishes</h2> : null}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {dishes.map((favorite) => (
              <ItemCard
                key={favorite.id}
                item={favorite.items!}
                canteenId={favorite.items!.canteen_id}
                canteenName={favorite.items!.canteens?.name ?? "Canteen"}
                subtitle={favorite.items!.canteens?.name}
              />
            ))}
          </div>
        </section>
      ) : null}

      {showCanteens && canteens.length > 0 ? (
        <section className="space-y-3">
          {filter === "all" ? <h2 className="section-title">Canteens</h2> : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {canteens.map((favorite) => (
              <CanteenCard key={favorite.id} canteen={favorite.canteens!} />
            ))}
          </div>
        </section>
      ) : null}

      {(filter === "dishes" && dishes.length === 0) ||
      (filter === "canteens" && canteens.length === 0) ? (
        <EmptyState
          icon={Heart}
          title={`No saved ${filter}`}
          description={`You haven't saved any ${filter} yet.`}
          compact
        />
      ) : null}
    </div>
  )
}
