"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ItemCard } from "@/components/menu/item-card"
import { Database } from "@/types/database.types"
import { cn } from "@/lib/utils/cn"

type Category = Database["public"]["Tables"]["categories"]["Row"]
type Item = Database["public"]["Tables"]["items"]["Row"]

interface MenuSectionProps {
  categories: Category[]
  items: Item[]
  canteenId: string
  canteenName: string
}

export function MenuSection({
  categories,
  items,
  canteenId,
  canteenName,
}: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  )

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category_id === selectedCategory)
    : items

  return (
    <div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
            selectedCategory === null
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
              selectedCategory === category.id
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No items available in this category.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              canteenId={canteenId}
              canteenName={canteenName}
            />
          ))}
        </div>
      )}
    </div>
  )
}

