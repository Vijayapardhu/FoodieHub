"use client"

import { useCartStore } from "@/store/cart-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Plus, Minus, Trash2 } from "lucide-react"

interface CartItemsProps {
  canteenId: string | null
}

export function CartItems({ canteenId }: CartItemsProps) {
  const { items, updateQuantity, removeItem } = useCartStore()
  const cartItems = canteenId
    ? items.filter((item) => item.canteenId === canteenId)
    : items

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Your cart is empty</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {cartItems.map((item) => (
        <Card key={item.itemId}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.canteenName}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold">₹{item.price}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                      size="icon"
                      variant="outline"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <Button
                      onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                      size="icon"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => removeItem(item.itemId)}
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

