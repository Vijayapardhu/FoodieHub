"use client"

import { useMemo, useState } from "react"
import { Search, UtensilsCrossed, X } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { Input } from "@/components/ui/input"
import { Chip, ChipRail } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { Section, SectionHeader } from "@/components/ui/section-header"
import { CanteenHero } from "@/components/canteen/canteen-hero"
import { FeaturedItemsRail } from "@/components/canteen/featured-items-rail"
import { FeedbackCarousel } from "@/components/canteen/feedback-carousel"
import { MenuItemRow } from "@/components/menu/menu-item-row"
import { MenuCategorySheet } from "@/components/canteen/menu-category-sheet"
import { StickyCart } from "@/components/cart/sticky-cart"
import {
  BrowseFilters,
  FilterButton,
  FilterSheet,
  countActiveFilters,
  defaultFilters,
} from "@/components/home/home-filters"
import { useDebounce } from "@/lib/hooks/use-debounce"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]
type Item = Database["public"]["Tables"]["items"]["Row"] & {
  categories?: { name: string } | null
}
type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  users: { full_name: string | null; avatar_url: string | null } | null
}

interface CanteenMenuPageProps {
  canteen: Canteen
  categories: Category[]
  items: Item[]
  featuredItems: Item[]
  comboItems: Item[]
  reviews: Review[]
  /** Advertising slot, rendered by the server so an unsold one costs nothing. */
  promo?: React.ReactNode
}

export function CanteenMenuPage({
  canteen,
  categories,
  items,
  featuredItems,
  comboItems,
  reviews,
  promo,
}: CanteenMenuPageProps) {
  const [rawQuery, setRawQuery] = useState("")
  const [filters, setFilters] = useState<BrowseFilters>(defaultFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const query = useDebounce(rawQuery, 180).trim().toLowerCase()
  const activeCount = countActiveFilters(filters)

  // Only the categories this canteen actually stocks, in menu order.
  const usedCategories = useMemo(() => {
    const ids = new Set(items.map((i) => i.category_id))
    return categories.filter((c) => ids.has(c.id))
  }, [categories, items])

  const filtered = useMemo(() => {
    let list = items

    if (filters.categoryId)
      list = list.filter((i) => i.category_id === filters.categoryId)
    if (filters.vegOnly) list = list.filter((i) => i.is_vegetarian)
    if (filters.minPrice !== null)
      list = list.filter((i) => Number(i.price) >= filters.minPrice!)
    if (filters.maxPrice !== null)
      list = list.filter((i) => Number(i.price) <= filters.maxPrice!)
    if (filters.minRating !== null)
      list = list.filter((i) => i.rating >= filters.minRating!)
    if (query)
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.description?.toLowerCase().includes(query)
      )

    const sorted = [...list]
    switch (filters.sort) {
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating)
        break
      case "price-asc":
        sorted.sort((a, b) => Number(a.price) - Number(b.price))
        break
      case "price-desc":
        sorted.sort((a, b) => Number(b.price) - Number(a.price))
        break
      default:
        // In-stock first, then alphabetical — a sold-out row is dead weight.
        sorted.sort(
          (a, b) =>
            Number(b.is_available) - Number(a.is_available) ||
            a.name.localeCompare(b.name)
        )
    }
    return sorted
  }, [items, filters, query])

  /** Group into category sections unless a single category is already picked. */
  const groups = useMemo(() => {
    if (filters.categoryId || query || filters.sort !== "relevance") {
      return [{ id: "all", name: "", items: filtered }]
    }

    const byCategory = new Map<string, Item[]>()
    for (const item of filtered) {
      const list = byCategory.get(item.category_id) ?? []
      list.push(item)
      byCategory.set(item.category_id, list)
    }

    return usedCategories
      .map((category) => ({
        id: category.id,
        name: category.name,
        items: byCategory.get(category.id) ?? [],
      }))
      .filter((group) => group.items.length > 0)
  }, [filtered, usedCategories, filters.categoryId, filters.sort, query])

  /** Only the sections actually on screen can be jumped to. */
  const menuSections = useMemo(
    () =>
      groups
        .filter((group) => group.name)
        .map((group) => ({
          id: group.id,
          name: group.name,
          count: group.items.length,
        })),
    [groups]
  )

  const clearAll = () => {
    setRawQuery("")
    setFilters(defaultFilters)
  }

  return (
    <>
      <div className="space-y-7">
        <CanteenHero canteen={canteen} />

        {!canteen.is_open ? (
          <div className="rounded-2xl border border-warning/30 bg-warning-soft p-3.5 text-sm text-warning">
            This canteen is closed right now. You can still browse the menu, but
            orders will only be accepted once it reopens.
          </div>
        ) : null}

        <FeaturedItemsRail
          title="Chef's picks"
          subtitle="Refreshed by the kitchen each day"
          items={featuredItems}
          canteenId={canteen.id}
          canteenSlug={canteen.slug}
          canteenName={canteen.name}
        />

        <FeaturedItemsRail
          title="Combos"
          subtitle="Bundles that feed a whole table"
          items={comboItems}
          canteenId={canteen.id}
          canteenSlug={canteen.slug}
          canteenName={canteen.name}
        />

        {/* Between the highlights and the full list, where somebody is still
            deciding rather than already reading. */}
        {promo}

        <Section>
          <SectionHeader
            title="Full menu"
            subtitle={`${filtered.length} of ${items.length} ${
              items.length === 1 ? "dish" : "dishes"
            }`}
          />

          {/* Sticky so search and categories stay reachable while scrolling.
              This page hides the app bar, so it pins to the top of the page. */}
          <div className="sticky top-0 z-30 -mx-4 space-y-3 border-b border-border bg-background/95 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-md sm:-mx-5 sm:px-5">
            <div className="flex items-center gap-2">
              <Input
                type="search"
                inputMode="search"
                placeholder={`Search ${canteen.name}`}
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                aria-label="Search this menu"
                startAdornment={<Search />}
                endAdornment={
                  rawQuery ? (
                    <button
                      type="button"
                      onClick={() => setRawQuery("")}
                      aria-label="Clear search"
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
                    >
                      <X />
                    </button>
                  ) : undefined
                }
              />
              <MenuCategorySheet sections={menuSections} />
              <FilterButton
                count={activeCount}
                onClick={() => setFiltersOpen(true)}
              />
            </div>

            {usedCategories.length > 0 ? (
              <ChipRail>
                <Chip
                  active={filters.categoryId === null}
                  onClick={() =>
                    setFilters((f) => ({ ...f, categoryId: null }))
                  }
                >
                  All
                </Chip>
                {usedCategories.map((category) => (
                  <Chip
                    key={category.id}
                    active={filters.categoryId === category.id}
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        categoryId:
                          f.categoryId === category.id ? null : category.id,
                      }))
                    }
                    count={
                      items.filter((i) => i.category_id === category.id).length
                    }
                  >
                    {category.name}
                  </Chip>
                ))}
              </ChipRail>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              art="search"
              title={
                items.length === 0 ? "Menu coming soon" : "Nothing matches"
              }
              description={
                items.length === 0
                  ? "This kitchen hasn't published its dishes yet. Check back shortly."
                  : "Try a different search term, or reset the filters."
              }
              action={
                items.length === 0
                  ? { label: "Browse other canteens", href: "/home" }
                  : { label: "Reset filters", onClick: clearAll }
              }
              compact
            />
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div
                  key={group.id}
                  id={`section-${group.id}`}
                  // Clears the sticky search bar, so a jumped-to heading is
                  // not hidden underneath it on arrival.
                  className="scroll-mt-32"
                >
                  {group.name ? (
                    <h3 className="muted-label pb-1 pt-2">
                      {group.name} · {group.items.length}
                    </h3>
                  ) : null}
                  <ul>
                    {group.items.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        canteenId={canteen.id}
                        canteenSlug={canteen.slug}
                        canteenName={canteen.name}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Section>

        <FeedbackCarousel reviews={reviews} />
      </div>

      <FilterSheet
        categories={usedCategories}
        value={filters}
        onChange={setFilters}
        scope="menu"
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
      />

      <StickyCart canteenId={canteen.id} canteenSlug={canteen.slug} />
    </>
  )
}
