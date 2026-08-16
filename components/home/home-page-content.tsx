"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Store, UtensilsCrossed, X } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { Input } from "@/components/ui/input"
import { Chip, ChipRail } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { Section, SectionHeader } from "@/components/ui/section-header"
import { CanteenCard } from "@/components/canteen/canteen-card"
import { ItemCard } from "@/components/menu/item-card"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { PromoCarousel } from "@/components/home/promo-carousel"
import { InstallBanner } from "@/components/pwa/install-card"
import type { PromoSlide } from "@/lib/utils/promo-banners"
import {
  BrowseFilters,
  FilterButton,
  FilterSheet,
  countActiveFilters,
  defaultFilters,
} from "@/components/home/home-filters"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]
type Item = Database["public"]["Tables"]["items"]["Row"] & {
  canteens: { id: string; slug: string | null; name: string; is_open: boolean } | null
}

interface HomePageContentProps {
  canteens: Canteen[]
  featuredItems: Item[]
  categories: Category[]
  items: Item[]
  /** Paid banner slots, best-priority first. */
  promos?: PromoSlide[]
  greetingName?: string | null
  /** "Your usual" rail, rendered by the server when there's a past order. */
  reorder?: React.ReactNode
  /** Live-order banner, rendered by the server when one is in flight. */
  activeOrder?: React.ReactNode
  /** Mid-page advertising slot. */
  inlinePromo?: React.ReactNode
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function HomePageContent({
  canteens,
  featuredItems,
  categories,
  items,
  promos,
  greetingName,
  reorder,
  activeOrder,
  inlinePromo,
}: HomePageContentProps) {
  const [rawQuery, setRawQuery] = useState("")
  const [filters, setFilters] = useState<BrowseFilters>(defaultFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // The categories table has no image column, so each tile borrows the photo
  // of its best-rated dish. That keeps the tiles honest — they show food the
  // canteens actually serve — without a schema change, and it needs no
  // separate upload flow for owners to keep up to date.
  const categoryCovers = useMemo(() => {
    const best: Record<string, { url: string; rating: number }> = {}
    for (const item of items) {
      if (!item.image_url || !item.category_id) continue
      const current = best[item.category_id]
      if (!current || item.rating > current.rating) {
        best[item.category_id] = { url: item.image_url, rating: item.rating }
      }
    }
    return Object.fromEntries(
      Object.entries(best).map(([id, v]) => [id, v.url])
    ) as Record<string, string>
  }, [items])

  // Typing filters a client-side list, so a short debounce is enough to stop
  // re-sorting the whole catalogue on every keystroke.
  const query = useDebounce(rawQuery, 180).trim().toLowerCase()
  const searching = query.length > 0
  const activeCount = countActiveFilters(filters)

  const matchedCanteens = useMemo(() => {
    let list = canteens

    if (filters.openOnly) list = list.filter((c) => c.is_open)
    if (filters.minRating !== null)
      list = list.filter((c) => c.rating >= filters.minRating!)
    if (query)
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      )

    const sorted = [...list]
    switch (filters.sort) {
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating)
        break
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        // Open canteens first — a closed one can't take the order.
        sorted.sort((a, b) => Number(b.is_open) - Number(a.is_open))
    }
    return sorted
  }, [canteens, filters, query])

  const matchedItems = useMemo(() => {
    let list = items

    if (filters.categoryId)
      list = list.filter((i) => i.category_id === filters.categoryId)
    if (filters.vegOnly) list = list.filter((i) => i.is_vegetarian)
    if (filters.openOnly) list = list.filter((i) => i.canteens?.is_open)
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
          i.description?.toLowerCase().includes(query) ||
          i.canteens?.name.toLowerCase().includes(query)
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
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        sorted.sort((a, b) => b.rating - a.rating)
    }
    return sorted
  }, [items, filters, query])

  // Any filter beyond canteen-level ones means the user is shopping for dishes.
  const dishMode =
    searching ||
    filters.categoryId !== null ||
    filters.vegOnly ||
    filters.minPrice !== null ||
    filters.maxPrice !== null

  const clearAll = () => {
    setRawQuery("")
    setFilters(defaultFilters)
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Anything already in flight comes first — that is what somebody
          opening the app mid-morning is checking on. */}
      {activeOrder}

      <InstallBanner />

      <header className="space-y-3">
        {/* One line on a phone. The old two-line greeting pushed the search
            box and the first row of food below the fold on a small screen. */}
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            {greeting()}
            {greetingName ? `, ${greetingName.split(" ")[0]}` : ""}
          </h1>
        </div>

        {/*
         * Sticky search. On a long scrolling home screen the search box is the
         * fastest route to a specific dish, and having to flick back to the
         * top to reach it is the single most annoying thing about browsing on
         * a phone. It docks under the app bar instead.
         */}
        <div className="sticky top-appbar z-30 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-md sm:-mx-5 sm:px-5">
          <div className="flex items-center gap-2">
            <Input
              type="search"
              inputMode="search"
              placeholder="Search dishes or canteens"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              aria-label="Search dishes or canteens"
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
            <FilterButton
              count={activeCount}
              onClick={() => setFiltersOpen(true)}
            />
          </div>
        </div>

        <ChipRail>
          <Chip
            active={filters.openOnly}
            onClick={() =>
              setFilters((f) => ({ ...f, openOnly: !f.openOnly }))
            }
          >
            Open now
          </Chip>
          <Chip
            active={filters.vegOnly}
            onClick={() => setFilters((f) => ({ ...f, vegOnly: !f.vegOnly }))}
          >
            Pure veg
          </Chip>
          <Chip
            active={filters.sort === "rating"}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                sort: f.sort === "rating" ? "relevance" : "rating",
              }))
            }
          >
            Top rated
          </Chip>
          <Chip
            active={filters.sort === "price-asc"}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                sort: f.sort === "price-asc" ? "relevance" : "price-asc",
              }))
            }
          >
            Budget first
          </Chip>
          {categories.slice(0, 8).map((category) => (
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
            >
              {category.name}
            </Chip>
          ))}
        </ChipRail>
      </header>

      <FilterSheet
        categories={categories}
        value={filters}
        onChange={setFilters}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
      />

      {dishMode ? (
        <Section>
          <SectionHeader
            title={searching ? `Results for “${rawQuery.trim()}”` : "Dishes"}
            subtitle={`${matchedItems.length} ${
              matchedItems.length === 1 ? "dish" : "dishes"
            }${
              matchedCanteens.length && searching
                ? ` · ${matchedCanteens.length} canteens`
                : ""
            }`}
          />

          {matchedItems.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No dishes match"
              description="Try a different search term, or loosen the filters."
              action={{ label: "Clear filters", onClick: clearAll }}
              compact
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {matchedItems.slice(0, 40).map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  canteenId={item.canteen_id}
                  canteenSlug={item.canteens?.slug}
                  canteenName={item.canteens?.name ?? "Canteen"}
                  subtitle={item.canteens?.name}
                />
              ))}
            </div>
          )}

          {searching && matchedCanteens.length > 0 ? (
            <div className="space-y-3 pt-4">
              <SectionHeader title="Matching canteens" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matchedCanteens.map((canteen) => (
                  <CanteenCard key={canteen.id} canteen={canteen} />
                ))}
              </div>
            </div>
          ) : null}
        </Section>
      ) : (
        <>
          {/* Paid placement, so it sits high — but below the reorder rail,
              which is the fastest path to checkout for a returning student
              and shouldn't be pushed down by advertising. */}
          {reorder}

          {promos && promos.length > 0 ? (
            <PromoCarousel slides={promos} />
          ) : null}

          {featuredItems.length > 0 ? (
            <Section>
              <SectionHeader
                title="Today's picks"
                subtitle="Hand-picked by the kitchens"
              />
              <div className="rail">
                {featuredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    canteenId={item.canteen_id}
                    canteenSlug={item.canteens?.slug}
                    canteenName={item.canteens?.name ?? "Canteen"}
                    subtitle={item.canteens?.name}
                    compact
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {categories.length > 0 ? (
            <Section>
              <SectionHeader title="What are you after?" />

              {/*
               * A rail on phones, a grid from `sm` up. Three tiny tiles per
               * row wasted the width and buried the later categories under a
               * wall of text; a horizontal rail gives each one a big enough
               * photo to recognise and a 44px-plus tap target.
               */}
              <div className="rail sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
                {categories.map((category) => {
                  const cover = categoryCovers[category.id]
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setFilters((f) => ({ ...f, categoryId: category.id }))
                      }
                      className="flex w-20 shrink-0 flex-col items-center gap-2 rounded-2xl border border-border bg-card p-2.5 text-center transition-transform active:scale-95 sm:w-auto sm:p-3"
                    >
                      <span className="relative h-14 w-14 overflow-hidden rounded-xl bg-primary-soft sm:h-11 sm:w-11">
                        {cover ? (
                          <Image
                            src={cover}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <UtensilsCrossed className="h-5 w-5 text-primary" />
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-2 text-2xs font-semibold leading-tight text-foreground sm:text-xs">
                        {category.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Section>
          ) : null}

          {inlinePromo}

          <Section>
            <SectionHeader
              title="All canteens"
              subtitle={`${matchedCanteens.length} on campus`}
            />

            {matchedCanteens.length === 0 ? (
              <EmptyState
                icon={Store}
                title={
                  canteens.length === 0
                    ? "No canteens yet"
                    : "Nothing matches those filters"
                }
                description={
                  canteens.length === 0
                    ? "Once a canteen is approved it will show up here."
                    : "Try turning off “Open now”, or widen the rating filter."
                }
                action={
                  canteens.length === 0
                    ? undefined
                    : { label: "Clear filters", onClick: clearAll }
                }
                compact
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matchedCanteens.map((canteen) => (
                  <CanteenCard key={canteen.id} canteen={canteen} />
                ))}
              </div>
            )}
          </Section>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Pay at the counter · Show your token to collect ·{" "}
            <Link href="/orders" className="font-semibold text-primary">
              Track an order
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
