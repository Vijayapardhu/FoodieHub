"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Database } from "@/types/database.types"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { FavoriteButton } from "@/components/menu/favorite-button"
import { Skeleton } from "@/components/ui/loading-state"

type Favorite = Database["public"]["Tables"]["favorites"]["Row"] & {
  items: (Database["public"]["Tables"]["items"]["Row"] & {
    canteens: { name: string } | null
  }) | null
  canteens: Database["public"]["Tables"]["canteens"]["Row"] | null
}

interface FavoritesListProps {
  favorites: Favorite[]
  loading?: boolean
}

export function FavoritesList({ favorites, loading }: FavoritesListProps) {
  const { addItem } = useCartStore()

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className="h-52 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <Card className="rounded-3xl border border-dashed border-slate-200 bg-white/90 shadow-sm">
        <CardContent className="space-y-4 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-primary">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-semibold text-foreground">
              No favorites yet
            </p>
            <p className="text-sm text-muted-foreground">
              Tap the heart icon on dishes and canteens to save them for later.
            </p>
          </div>
          <div className="flex justify-center">
            <Link href="/home">
              <Button className="rounded-full bg-primary text-white hover:bg-primary/90">
                Browse canteens
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {favorites.map((favorite) => {
        if (favorite.items) {
          const item = favorite.items
          return (
            <Card key={favorite.id} className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="absolute right-2 top-2 z-10">
                <FavoriteButton itemId={item.id} />
              </div>
              <Link href={`/canteen/${item.canteen_id}`}>
                <div className="relative h-48 w-full bg-muted">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
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
                <CardContent className="p-4">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.canteens?.name}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      ₹{item.price}
                    </span>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        addItem({
                          itemId: item.id,
                          name: item.name,
                          price: Number(item.price),
                          imageUrl: item.image_url,
                          canteenId: item.canteen_id,
                          canteenName: item.canteens?.name || "Canteen",
                        })
                      }}
                      className="rounded-full bg-primary text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        } else if (favorite.canteens) {
          const canteen = favorite.canteens
          return (
            <Card key={favorite.id} className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="absolute right-2 top-2 z-10">
                <FavoriteButton canteenId={canteen.id} />
              </div>
              <Link href={`/canteen/${canteen.id}`}>
                <div className="relative h-48 w-full bg-muted">
                  {canteen.banner_url ? (
                    <Image
                      src={canteen.banner_url}
                      alt={canteen.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <span className="text-4xl">🍽️</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{canteen.name}</h3>
                  {canteen.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {canteen.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-medium">
                      ⭐ {Number(canteen.rating).toFixed(1)}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        canteen.is_open ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {canteen.is_open ? "Open" : "Closed"}
                    </span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        }
        return null
      })}
    </div>
  )
}
