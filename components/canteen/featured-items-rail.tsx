"use client"

import { Database } from "@/types/database.types"
import { ItemCard } from "@/components/menu/item-card"
import { Section, SectionHeader } from "@/components/ui/section-header"

type Item = Database["public"]["Tables"]["items"]["Row"]

interface FeaturedItemsRailProps {
  title: string
  subtitle?: string
  items: Item[]
  canteenId: string
  canteenSlug?: string | null
  canteenName: string
}

/** Horizontal rail of item cards. Cart wiring lives inside ItemCard. */
export function FeaturedItemsRail({
  title,
  subtitle,
  items,
  canteenId,
  canteenSlug,
  canteenName,
}: FeaturedItemsRailProps) {
  if (items.length === 0) return null

  return (
    <Section>
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="rail">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            canteenId={canteenId}
            canteenSlug={canteenSlug}
            canteenName={canteenName}
            compact
          />
        ))}
      </div>
    </Section>
  )
}
