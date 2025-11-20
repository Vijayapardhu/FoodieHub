"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import Link from "next/link"

export function Navbar() {
  const itemCount = useCartStore((state) => state.getItemCount())

  return (
    <nav className="sticky top-0 z-50 border-b border-orange-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/home" className="text-xl font-semibold text-primary">
          FoodieHub
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/favorites">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-orange-100 bg-white shadow-sm"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full border border-orange-100 bg-white shadow-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

