"use client"

import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart-store"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface StickyCartProps {
  canteenId: string
}

export function StickyCart({ canteenId }: StickyCartProps) {
  const router = useRouter()
  const items = useCartStore((state) => state.getItemsByCanteen(canteenId))
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  if (itemCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background p-4 md:bottom-0">
      <div className="container">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
            <p className="text-lg font-bold">₹{total.toFixed(2)}</p>
          </div>
          <Link href={`/cart?canteen=${canteenId}`}>
            <Button size="lg" className="gap-2">
              <ShoppingCart className="h-5 w-5" />
              View Cart
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

