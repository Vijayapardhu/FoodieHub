"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Database } from "@/types/database.types"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"

type Item = Database["public"]["Tables"]["items"]["Row"]

interface FeaturedItemsRailProps {
  title: string
  subtitle?: string
  items: Item[]
  getQuantity: (itemId: string) => number
  onAdd: (item: Item) => void
  onRemove: (itemId: string) => void
}

export function FeaturedItemsRail({
  title,
  subtitle,
  items,
  getQuantity,
  onAdd,
  onRemove,
}: FeaturedItemsRailProps) {
  if (items.length === 0) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm font-medium text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {items.map((item) => {
          const quantity = getQuantity(item.id)
          const imageSrc = item.featured_image_url || item.image_url
          const isAvailable = item.is_available
          return (
            <Card
              key={item.id}
              className={`group relative w-72 flex-shrink-0 overflow-hidden rounded-3xl border-0 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                !isAvailable ? "opacity-60" : ""
              }`}
            >
              <Link
                href={`/items/${item.id}`}
                className="relative block h-44 w-full overflow-hidden bg-gradient-to-br from-orange-50 to-primary/10"
                aria-label={`Open ${item.name}`}
              >
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="288px"
                  />
                ) : (
                  <ImagePlaceholder type="item" size="xl" />
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
              </Link>
              <div className="space-y-3 p-5">
                <Link
                  href={`/items/${item.id}`}
                  className="block"
                >
                  <h3 className="line-clamp-1 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </Link>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-primary">₹{item.price}</p>
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
                {!isAvailable ? (
                  <Button className="w-full rounded-full bg-gray-400" disabled>
                    Unavailable
                  </Button>
                ) : quantity === 0 ? (
                  <Button
                    className="w-full rounded-full bg-gradient-to-r from-primary to-orange-500 font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={(e) => {
                      e.preventDefault()
                      onAdd(item)
                    }}
                  >
                    Add to cart
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-3 rounded-full border-2 border-primary bg-orange-50 p-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full hover:bg-primary/10"
                      onClick={(e) => {
                        e.preventDefault()
                        onRemove(item.id)
                      }}
                    >
                      <span className="text-lg text-primary">−</span>
                    </Button>
                    <span className="min-w-[2ch] text-center text-lg font-bold text-primary">
                      {quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full hover:bg-primary/10"
                      onClick={(e) => {
                        e.preventDefault()
                        onAdd(item)
                      }}
                    >
                      <span className="text-lg text-primary">+</span>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}


