"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Database } from "@/types/database.types"

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
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => {
          const quantity = getQuantity(item.id)
          const imageSrc = item.featured_image_url || item.image_url
          const isAvailable = item.is_available
          return (
            <Card
              key={item.id}
              className={`relative w-64 flex-shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-b from-white to-orange-50/40 ${
                !isAvailable ? "opacity-60" : ""
              }`}
            >
              <Link
                href={`/items/${item.id}`}
                className="relative block h-36 w-full overflow-hidden bg-orange-50"
                aria-label={`Open ${item.name}`}
              >
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="256px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🍱</div>
                )}
                {!isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-xs font-semibold text-white">Unavailable</span>
                  </div>
                )}
              </Link>
              <div className="space-y-2 p-4">
                <Link
                  href={`/items/${item.id}`}
                  className="font-semibold text-foreground hover:text-primary"
                >
                  {item.name}
                </Link>
                {item.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
                <p className="text-lg font-semibold text-primary">₹{item.price}</p>
                {!isAvailable ? (
                  <Button className="w-full rounded-full" disabled>
                    Unavailable
                  </Button>
                ) : quantity === 0 ? (
                  <Button
                    className="w-full rounded-full"
                    onClick={(e) => {
                      e.preventDefault()
                      onAdd(item)
                    }}
                  >
                    Add to cart
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 rounded-full"
                      onClick={(e) => {
                        e.preventDefault()
                        onRemove(item.id)
                      }}
                    >
                      -
                    </Button>
                    <span className="min-w-[2ch] text-center font-semibold">{quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 rounded-full"
                      onClick={(e) => {
                        e.preventDefault()
                        onAdd(item)
                      }}
                    >
                      +
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


