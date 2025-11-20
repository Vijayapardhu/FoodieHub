"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus, RefreshCw } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { Database } from "@/types/database.types"
import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/loading-state"
import { CanteenHero } from "@/components/canteen/canteen-hero"
import { FeaturedItemsRail } from "@/components/canteen/featured-items-rail"
import { FeedbackCarousel } from "@/components/canteen/feedback-carousel"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]
type Item = Database["public"]["Tables"]["items"]["Row"] & {
  categories?: { name: string } | null
}
type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  users: { full_name: string | null; avatar_url: string | null } | null
}

interface CanteenMenuPageProps {
  canteen: Canteen
  categories: Category[]
  items: Item[]
  featuredItems: Item[]
  comboItems: Item[]
  reviews: Review[]
}

export function CanteenMenuPage({
  canteen,
  categories,
  items,
  featuredItems,
  comboItems,
  reviews,
}: CanteenMenuPageProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { addItem, updateQuantity, items: cartItems } = useCartStore()

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category_id === selectedCategory)
    : items

  const showGlobalPlaceholder = categories.length === 0 && items.length === 0

  const handleAddItem = (item: Item) => {
    const cartItem = cartItems.find((i) => i.itemId === item.id)
    if (cartItem) {
      updateQuantity(item.id, cartItem.quantity + 1)
    } else {
      addItem({
        itemId: item.id,
        name: item.name,
        price: Number(item.price),
        imageUrl: item.image_url,
        canteenId: canteen.id,
        canteenName: canteen.name,
      })
    }
  }

  const handleRemoveItem = (itemId: string) => {
    const cartItem = cartItems.find((i) => i.itemId === itemId)
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(itemId, cartItem.quantity - 1)
    } else {
      useCartStore.getState().removeItem(itemId)
    }
  }

  const getItemQuantity = (itemId: string) => {
    return cartItems.find((i) => i.itemId === itemId)?.quantity || 0
  }

  const cartItemCount = cartItems
    .filter((item) => item.canteenId === canteen.id)
    .reduce((sum, item) => sum + item.quantity, 0)

  const cartTotal = cartItems
    .filter((item) => item.canteenId === canteen.id)
    .reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <CanteenHero canteen={canteen} />

      {featuredItems.length > 0 && (
        <FeaturedItemsRail
          title="Chef's featured picks"
          subtitle="Curated by the kitchen, refreshed daily"
          items={featuredItems}
          getQuantity={getItemQuantity}
          onAdd={handleAddItem}
          onRemove={handleRemoveItem}
        />
      )}

      {comboItems.length > 0 && (
        <FeaturedItemsRail
          title="Top combos"
          subtitle="Bundle offers crafted for hungry teams"
          items={comboItems}
          getQuantity={getItemQuantity}
          onAdd={handleAddItem}
          onRemove={handleRemoveItem}
        />
      )}

      {reviews.length > 0 && <FeedbackCarousel reviews={reviews} />}

      {/* Categories */}
      <div
        className="mb-6 flex gap-2 overflow-x-auto pb-2"
        aria-busy={categories.length === 0}
      >
        <button
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === null
              ? "bg-primary text-white"
              : "bg-white text-gray-700"
          }`}
        >
          All
        </button>
        {categories.length === 0 ? (
          showGlobalPlaceholder ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-9 w-20 rounded-full" />
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              Categories coming soon
            </span>
          )
        ) : (
          categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {category.name}
            </button>
          ))
        )}
      </div>

      {/* Menu Items */}
      <div className="space-y-4" aria-busy={filteredItems.length === 0}>
        {filteredItems.length === 0 ? (
          showGlobalPlaceholder ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="space-y-4 py-12 text-center">
                <p className="text-muted-foreground">
                  Menu coming soon. Check back or explore other canteens.
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    className="gap-2 rounded-full"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                  <Link href="/home">
                    <Button className="rounded-full bg-primary text-white hover:bg-primary/90">
                      Browse others
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          filteredItems.map((item) => {
            const quantity = getItemQuantity(item.id)
            const isAvailable = item.is_available

            return (
              <Card
                key={item.id}
                className={`cursor-pointer overflow-hidden ${
                  !isAvailable ? "opacity-60" : ""
                }`}
                onClick={() => router.push(`/items/${item.id}`)}
                role="button"
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-3xl">
                          🍔
                        </div>
                      )}
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-xs font-semibold text-white">
                            Unavailable
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{item.name}</p>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            ₹{item.price}
                          </span>
                          {item.is_vegetarian ? (
                            <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                              Veg
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                              Non-Veg
                            </span>
                          )}
                        </div>
                      </div>

                      {isAvailable && (
                        <div className="mt-3">
                          {quantity === 0 ? (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddItem(item)
                              }}
                              size="sm"
                              className="w-full bg-primary hover:bg-primary/90"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveItem(item.id)
                                }}
                                size="icon"
                                variant="outline"
                                className="h-9 w-9"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-semibold">
                                {quantity}
                              </span>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddItem(item)
                                }}
                                size="icon"
                                variant="outline"
                                className="h-9 w-9"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Sticky Add to Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-white p-4 shadow-lg md:bottom-0">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
              </p>
              <p className="text-xl font-bold">₹{cartTotal.toFixed(2)}</p>
            </div>
            <Link href={`/cart?canteen=${canteen.id}`}>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Add to Cart
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

