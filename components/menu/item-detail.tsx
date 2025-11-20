"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FavoriteButton } from "@/components/menu/favorite-button"
import { useCartStore } from "@/store/cart-store"
import { Database } from "@/types/database.types"
import { Minus, Plus, MapPin, Utensils, Flame } from "lucide-react"
import { cn } from "@/lib/utils/cn"

type Item = Database["public"]["Tables"]["items"]["Row"]
type Canteen = Database["public"]["Tables"]["canteens"]["Row"] | null

interface ItemDetailProps {
  item: Item
  canteen: Canteen
  relatedItems: Item[]
  categoryName?: string | null
}

export function ItemDetail({
  item,
  canteen,
  relatedItems,
  categoryName,
}: ItemDetailProps) {
  const gallery = useMemo(() => {
    const sources = [
      item.featured_image_url,
      item.image_url,
      ...(item.gallery_images ?? []),
    ].filter(Boolean) as string[]
    if (sources.length === 0) return [null]
    return Array.from(new Set(sources))
  }, [item.featured_image_url, item.image_url, item.gallery_images])

  const [activeImage, setActiveImage] = useState(gallery[0] ?? null)
  const { items: cartItems, addItem, updateQuantity } = useCartStore()
  const cartItem = cartItems.find((cart) => cart.itemId === item.id)
  const quantity = cartItem?.quantity ?? 0

  const nutritionEntries =
    item.nutritional_info &&
    typeof item.nutritional_info === "object" &&
    !Array.isArray(item.nutritional_info)
      ? Object.entries(item.nutritional_info as Record<string, string | number>)
      : []

  const handleAddToCart = () => {
    if (cartItem) {
      updateQuantity(item.id, quantity + 1)
      return
    }

    addItem({
      itemId: item.id,
      name: item.name,
      price: Number(item.price),
      imageUrl: item.image_url,
      canteenId: item.canteen_id,
      canteenName: canteen?.name ?? "Canteen",
    })
  }

  const handleDecrease = () => {
    if (!cartItem) return
    if (quantity <= 1) {
      useCartStore.getState().removeItem(item.id)
      return
    }

    updateQuantity(item.id, quantity - 1)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-orange-100 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-orange-50">
          {activeImage ? (
            <Image
              src={activeImage}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">
              🍽️
            </div>
          )}
          <div className="absolute left-4 top-4 flex gap-2">
            {item.is_featured && (
              <Badge className="rounded-full bg-white/80 text-primary">
                Chef pick
              </Badge>
            )}
            <Badge
              className={cn(
                "rounded-full border text-xs font-semibold",
                item.is_vegetarian
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-600"
              )}
            >
              {item.is_vegetarian ? "Vegetarian" : "Non-Veg"}
            </Badge>
          </div>
          <div className="absolute right-4 top-4">
            <FavoriteButton itemId={item.id} className="bg-white/70 shadow" />
          </div>
        </div>

        {gallery.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {gallery.map((src, idx) => (
              <button
                key={`${src}-${idx}`}
                type="button"
                onClick={() => setActiveImage(src ?? null)}
                className={cn(
                  "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border transition-all",
                  activeImage === src
                    ? "border-primary shadow-md"
                    : "border-transparent"
                )}
              >
                {src ? (
                  <Image
                    src={src}
                    alt={`${item.name} preview ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-orange-50 text-2xl">
                    🍽️
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-orange-400">
              {categoryName ?? "Signature Dish"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {item.name}
            </h1>
            {item.description && (
              <p className="mt-3 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">₹{item.price}</p>
            <p className="text-xs text-muted-foreground">
              incl. of all taxes
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              item.is_available
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            )}
          >
            {item.is_available ? "Currently available" : "Temporarily sold out"}
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            ⭐ {Number(item.rating || 4.5).toFixed(1)} ·{" "}
            {item.total_reviews ?? 0} reviews
          </Badge>
          {item.is_featured && (
            <Badge
              variant="outline"
              className="rounded-full border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-600"
            >
              Trending
            </Badge>
          )}
        </div>

        <div className="my-5 h-px w-full bg-orange-100" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Served by{" "}
            {canteen ? (
              <Link
                href={`/canteen/${canteen.id}`}
                className="font-semibold text-primary"
              >
                {canteen.name}
              </Link>
            ) : (
              "canteen partner"
            )}
            {canteen?.address && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {canteen.address}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-full border border-orange-100 bg-orange-50/60 px-2 py-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full"
              onClick={handleDecrease}
              disabled={quantity === 0}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <span className="min-w-[2ch] text-center text-lg font-semibold">
              {quantity}
            </span>
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-primary text-white hover:bg-primary/90"
              onClick={handleAddToCart}
              disabled={!item.is_available}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleAddToCart}
              className="ml-2 rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-lg hover:bg-primary/90"
              disabled={!item.is_available}
            >
              {quantity === 0 ? "Add to cart" : "Add one more"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">About this dish</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card className="rounded-2xl border-0 bg-orange-50/70">
            <CardContent className="flex items-start gap-3 p-4">
              <Utensils className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Served hot & fresh
                </p>
                <p className="text-xs text-muted-foreground">
                  Prepared on order with hygiene checks and minimal oil.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 bg-orange-50/70">
            <CardContent className="flex items-start gap-3 p-4">
              <Flame className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Spice level
                </p>
                <p className="text-xs text-muted-foreground">
                  Medium. Let the canteen know at checkout if you prefer mild.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {nutritionEntries.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Nutrition snapshot
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {nutritionEntries.map(([key, value]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="rounded-full border-dashed px-3 py-1 text-xs"
                >
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {relatedItems.length > 0 && (
        <div className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Pair it with</h2>
              <p className="text-sm text-muted-foreground">
                Recommended from the same kitchen
              </p>
            </div>
            <Link
              href={`/canteen/${item.canteen_id}`}
              className="text-sm font-semibold text-primary"
            >
              View all
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {relatedItems.map((related) => (
              <Card
                key={related.id}
                className="w-56 flex-shrink-0 overflow-hidden rounded-2xl border border-orange-50 bg-gradient-to-b from-white to-orange-50/30"
              >
                <Link href={`/items/${related.id}`}>
                  <div className="relative h-32 w-full">
                    {related.image_url ? (
                      <Image
                        src={related.image_url}
                        alt={related.name}
                        fill
                        className="object-cover"
                        sizes="224px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">
                        🍱
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="space-y-2 p-4">
                  <div>
                    <Link
                      href={`/items/${related.id}`}
                      className="line-clamp-1 font-semibold text-gray-900"
                    >
                      {related.name}
                    </Link>
                    <p className="text-sm font-medium text-primary">
                      ₹{related.price}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full text-[11px]",
                        related.is_vegetarian
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      )}
                    >
                      {related.is_vegetarian ? "Veg" : "Non-Veg"}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full border border-orange-100"
                      onClick={() => {
                        useCartStore.getState().addItem({
                          itemId: related.id,
                          name: related.name,
                          price: Number(related.price),
                          imageUrl: related.image_url,
                          canteenId: related.canteen_id,
                          canteenName: canteen?.name ?? "Canteen",
                        })
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

