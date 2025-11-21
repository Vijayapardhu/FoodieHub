"use client"

import { useCartStore } from "@/store/cart-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Plus, Minus, Trash2 } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { CartSummary } from "@/components/cart/cart-summary"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import Link from "next/link"

interface CartPageContentProps {
  canteenId: string | null
}

export function CartPageContent({ canteenId }: CartPageContentProps) {
  const router = useRouter()
  const { items, updateQuantity, removeItem, getItemsByCanteen } = useCartStore()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const cartItems = canteenId
    ? getItemsByCanteen(canteenId)
    : items

  if (cartItems.length === 0) {
    return (
      <Card className="rounded-3xl border border-dashed border-slate-200 bg-white/90">
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Your cart is empty. Let&apos;s fix that!
          </p>
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

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = cartItems.find((i) => i.itemId === itemId)
    if (item) {
      const newQuantity = item.quantity + change
      if (newQuantity <= 0) {
        removeItem(itemId)
      } else {
        updateQuantity(itemId, newQuantity)
      }
    }
  }

  return (
    <div className="space-y-4">
      {!canteenId && (
        <Card className="rounded-2xl border border-dashed border-slate-200 bg-white/90">
          <CardContent className="space-y-2 py-4 text-sm text-muted-foreground">
            <p>
              You have items from multiple canteens. We&apos;ll automatically split
              them into separate orders during checkout so each kitchen gets its own
              token.
            </p>
            <p className="text-xs">
              Want to apply offers? Filter to a canteen via the menu and check out per
              canteen to unlock discounts.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Cart Items */}
      <div className="space-y-3">
        {cartItems.map((item) => (
          <Card key={item.itemId} className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <ImagePlaceholder type="item" size="sm" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.canteenName}
                    </p>
                    <p className="mt-1 font-bold text-primary">₹{item.price}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleQuantityChange(item.itemId, -1)}
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        onClick={() => handleQuantityChange(item.itemId, 1)}
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={() => removeItem(item.itemId)}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>Want to add more? Continue browsing canteens.</p>
          <Link href="/home">
            <Button variant="outline" size="sm" className="rounded-full">
              Continue shopping
            </Button>
          </Link>
        </div>
      </div>

      {/* Cart Summary with Advanced Features */}
      <CartSummary canteenId={canteenId} />
    </div>
  )
}

