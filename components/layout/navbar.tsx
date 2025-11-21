"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart, Search } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
  const itemCount = useCartStore((state) => state.getItemCount())
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        <Link href="/home" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent hidden sm:block">
            FoodieHub
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/favorites">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <Heart className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <Link href="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-primary to-orange-400 text-[10px] font-bold text-white shadow-lg">
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

