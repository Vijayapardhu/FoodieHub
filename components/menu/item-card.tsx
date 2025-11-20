"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { Database } from "@/types/database.types"
import { FavoriteButton } from "./favorite-button"
import { useState } from "react"

type Item = Database["public"]["Tables"]["items"]["Row"]

interface ItemCardProps {
  item: Item
  canteenId: string
  canteenName: string
}

export function ItemCard({ item, canteenId, canteenName }: ItemCardProps) {
  const { addItem, updateQuantity, items } = useCartStore()
  const cartItem = items.find((i) => i.itemId === item.id)
  const quantity = cartItem?.quantity || 0

  const handleAdd = () => {
    if (quantity === 0) {
      addItem({
        itemId: item.id,
        name: item.name,
        price: Number(item.price),
        imageUrl: item.image_url,
        canteenId,
        canteenName,
      })
    } else {
      updateQuantity(item.id, quantity + 1)
    }
  }

  const handleRemove = () => {
    if (quantity > 0) {
      updateQuantity(item.id, quantity - 1)
    }
  }

  if (!item.is_available) {
    return (
      <Card className="opacity-60">
        <CardContent className="p-4">
          <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
            {item.image_url && (
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-lg font-semibold text-white">
                Unavailable
              </span>
            </div>
          </div>
          <h3 className="mt-3 font-semibold">{item.name}</h3>
          <p className="text-sm text-muted-foreground">₹{item.price}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute right-2 top-2 flex gap-2">
            <FavoriteButton itemId={item.id} />
            {!item.is_vegetarian && (
              <div className="rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                Non-Veg
              </div>
            )}
            {item.is_vegetarian && (
              <div className="rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white">
                Veg
              </div>
            )}
          </div>
        </div>
        <h3 className="mt-3 font-semibold">{item.name}</h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold">₹{item.price}</span>
          {quantity === 0 ? (
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={handleRemove} size="icon" variant="outline">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button onClick={handleAdd} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

