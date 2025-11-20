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
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-10 md:py-8">
      <CanteenHero canteen={canteen} />

      {featuredItems.length > 0 && (
        <section className="space-y-4">
          <FeaturedItemsRail
            title="Chef's featured picks"
            subtitle="Curated by the kitchen, refreshed daily"
            items={featuredItems}
            getQuantity={getItemQuantity}
            onAdd={handleAddItem}
            onRemove={handleRemoveItem}
          />
        </section>
      )}

      {comboItems.length > 0 && (
        <section className="space-y-4">
          <FeaturedItemsRail
            title="Top combos"
            subtitle="Bundle offers crafted for hungry teams"
            items={comboItems}
            getQuantity={getItemQuantity}
            onAdd={handleAddItem}
            onRemove={handleRemoveItem}
          />
        </section>
      )}

      {reviews.length > 0 && (
        <section className="space-y-4">
          <FeedbackCarousel reviews={reviews} />
        </section>
      )}

      {/* Categories */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">Menu</h2>
          <p className="text-sm text-muted-foreground">Explore our delicious offerings</p>
        </div>
        <div
          className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
          aria-busy={categories.length === 0}
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className={`group whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 ${
              selectedCategory === null
                ? "bg-gradient-to-r from-primary to-orange-500 text-white shadow-md shadow-primary/30 scale-105"
                : "bg-white text-gray-700 hover:bg-orange-50 hover:shadow-md border border-orange-100"
            }`}
          >
            All Menu
          </button>
          {categories.length === 0 ? (
            showGlobalPlaceholder ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-24 rounded-full" />
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
                className={`group whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-primary to-orange-500 text-white shadow-md shadow-primary/30 scale-105"
                    : "bg-white text-gray-700 hover:bg-orange-50 hover:shadow-md border border-orange-100"
                }`}
              >
                {category.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-4" aria-busy={filteredItems.length === 0}>
        {filteredItems.length === 0 ? (
          showGlobalPlaceholder ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="space-y-4 py-16 text-center">
                <p className="text-lg font-semibold text-foreground">
                  Menu coming soon
                </p>
                <p className="text-muted-foreground">
                  Check back later or explore other canteens.
                </p>
                <div className="flex justify-center gap-3 pt-4">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const quantity = getItemQuantity(item.id)
              const isAvailable = item.is_available

              return (
                <Card
                  key={item.id}
                  className={`group cursor-pointer overflow-hidden border-0 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    !isAvailable ? "opacity-60" : ""
                  }`}
                  onClick={() => router.push(`/items/${item.id}`)}
                  role="button"
                >
                  <CardContent className="p-0">
                    {/* Item Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-orange-50 to-primary/10">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-5xl">
                          🍔
                        </div>
                      )}
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                          <span className="rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white">
                            Unavailable
                          </span>
                        </div>
                      )}
                      {item.is_featured && (
                        <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                          ⭐ Featured
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="space-y-3 p-4">
                      <div>
                        <h3 className="line-clamp-1 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary">
                            ₹{item.price}
                          </span>
                          {item.is_vegetarian ? (
                            <span className="rounded-full bg-green-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                              Veg
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                              Non-Veg
                            </span>
                          )}
                        </div>
                      </div>

                      {isAvailable && (
                        <div className="pt-2">
                          {quantity === 0 ? (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddItem(item)
                              }}
                              className="w-full rounded-full bg-gradient-to-r from-primary to-orange-500 font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
                              size="lg"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add to cart
                            </Button>
                          ) : (
                            <div className="flex items-center justify-center gap-3 rounded-full border-2 border-primary bg-orange-50 p-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveItem(item.id)
                                }}
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-primary/10"
                              >
                                <Minus className="h-4 w-4 text-primary" />
                              </Button>
                              <span className="min-w-[2ch] text-center text-lg font-bold text-primary">
                                {quantity}
                              </span>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddItem(item)
                                }}
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-primary/10"
                              >
                                <Plus className="h-4 w-4 text-primary" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky Add to Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 border-t-2 border-primary/20 bg-white/95 backdrop-blur-lg p-4 shadow-2xl md:bottom-0">
          <div className="container mx-auto flex items-center justify-between max-w-7xl">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {cartItemCount} {cartItemCount === 1 ? "item" : "items"} in cart
              </p>
              <p className="text-2xl font-bold text-primary">₹{cartTotal.toFixed(2)}</p>
            </div>
            <Link href={`/cart?canteen=${canteen.id}`}>
              <Button
                size="lg"
                className="rounded-full bg-gradient-to-r from-primary to-orange-500 px-8 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                View Cart
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

