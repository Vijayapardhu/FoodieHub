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
import { SectionRail } from "@/components/home/section-rail"
import { DiscoverySearch } from "@/components/home/discovery-search"
import { CanteenRailCard } from "@/components/canteen/canteen-rail-card"
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
  /** Shown only when a search finds nothing — the cheapest slot sold. */
  searchEmptyPromo?: React.ReactNode
}

/** A dish a kitchen can turn round quickly enough to wait for. */
const QUICK_MINUTES = 10

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
  searchEmptyPromo,
}: HomePageContentProps) {
  const [rawQuery, setRawQuery] = useState("")
  const [filters, setFilters] = useState<BrowseFilters>(defaultFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  /** "Fast pickup" — dishes the kitchen can turn round quickly. */
  const [quickOnly, setQuickOnly] = useState(false)

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
    if (quickOnly)
      list = list.filter((i) => (i.prep_minutes ?? 99) <= QUICK_MINUTES)
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
  }, [items, filters, query, quickOnly])

  // Any filter beyond canteen-level ones means the user is shopping for dishes.
  const dishMode =
    searching ||
    filters.categoryId !== null ||
    filters.vegOnly ||
    quickOnly ||
    filters.minPrice !== null ||
    filters.maxPrice !== null

  /*
   * Collections, derived from the catalogue already loaded for search rather
   * than fetched or invented. Each one is a different reason to want food —
   * cheap, quick, well liked — which is what turns a list of dishes into
   * something worth scrolling.
   */
  const orderable = useMemo(
    () => items.filter((item) => item.canteens?.is_open !== false),
    [items]
  )

  const underHundred = useMemo(
    () =>
      orderable
        .filter((item) => Number(item.price) <= 99)
        .sort((a, b) => Number(a.price) - Number(b.price))
        .slice(0, 12),
    [orderable]
  )

  const quickBites = useMemo(
    () =>
      orderable
        .filter((item) => (item.prep_minutes ?? 99) <= QUICK_MINUTES)
        .sort((a, b) => (a.prep_minutes ?? 99) - (b.prep_minutes ?? 99))
        .slice(0, 12),
    [orderable]
  )

  const studentFavourites = useMemo(
    () =>
      orderable
        .filter((item) => item.total_reviews > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 12),
    [orderable]
  )

  /** What each canteen actually cooks, for its card's subtitle. */
  const cuisinesByCanteen = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const item of items) {
      const name = (item as any).categories?.name
      if (!item.canteen_id) continue
      const set = map.get(item.canteen_id) ?? new Set<string>()
      if (name) set.add(name)
      map.set(item.canteen_id, set)
    }
    return map
  }, [items])

  const openCanteens = useMemo(
    () =>
      [...canteens].sort(
        (a, b) => Number(b.is_open) - Number(a.is_open) || b.rating - a.rating
      ),
    [canteens]
  )

  const clearAll = () => {
    setRawQuery("")
    setFilters(defaultFilters)
    setQuickOnly(false)
  }

  return (
    <div className="space-y-7">
      {/* Anything already in flight comes first — that is what somebody
          opening the app mid-morning is checking on. */}
      {activeOrder}

      <InstallBanner />

      <header className="space-y-2.5">
        {/*
         * Campus framing, not a delivery address. Everything here is a short
         * walk away, so a "delivering to" row would be borrowed furniture
         * from an app this deliberately is not.
         */}
        <div>
          <p className="text-2xs font-bold uppercase tracking-[0.16em] text-primary">
            Campus food · {canteens.length} canteen
            {canteens.length === 1 ? "" : "s"}
          </p>
          <h1 className="mt-0.5 text-[1.75rem] font-extrabold leading-tight tracking-tight text-foreground">
            {greeting()}
            {greetingName ? `, ${greetingName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-[0.9375rem] leading-snug text-muted-foreground">
            What are you craving today?
          </p>
        </div>

      </header>

      {/*
       * Sticky search, and a direct child of the page container on purpose.
       *
       * It was already marked sticky but sat inside <header>, and a sticky
       * element is confined to its own parent — so it pinned for the ~150px
       * the greeting block occupied and then scrolled away with it, which is
       * indistinguishable from not being sticky at all. Its containing block
       * has to be the element that spans the whole page.
       *
       * The offset carries the safe-area inset because the app bar above it
       * does too; without it the box tucks under the notch on an iPhone.
       */}
      <div className="sticky top-[calc(theme(spacing.appbar)+env(safe-area-inset-top))] z-30 -mx-4 !mt-3 bg-background/95 px-4 py-2 backdrop-blur-md sm:-mx-5 sm:px-5">
        <DiscoverySearch
          value={rawQuery}
          onChange={setRawQuery}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={activeCount}
        />
      </div>

      <div className="!mt-3">
        <ChipRail>
          <Chip
            active={filters.openOnly}
            onClick={() => setFilters((f) => ({ ...f, openOnly: !f.openOnly }))}
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
            active={filters.maxPrice === 100}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                maxPrice: f.maxPrice === 100 ? null : 100,
              }))
            }
          >
            Under ₹100
          </Chip>
          {/* Pickup, not delivery — nobody is riding anywhere. */}
          <Chip
            active={quickOnly}
            onClick={() => setQuickOnly((on) => !on)}
          >
            Fast pickup
          </Chip>
          {categories.slice(0, 8).map((category) => (
            <Chip
              key={category.id}
              active={filters.categoryId === category.id}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  categoryId: f.categoryId === category.id ? null : category.id,
                }))
              }
            >
              {category.name}
            </Chip>
          ))}
        </ChipRail>
      </div>

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
            <>
              <EmptyState
                art="search"
                title="No dishes match"
                description="Try a different search term, or loosen the filters."
                action={{ label: "Clear filters", onClick: clearAll }}
                compact
              />
              {/* The one slot where an advert is genuinely more useful than
                  the nothing it replaces. */}
              <div className="mt-3">{searchEmptyPromo}</div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
          {/* Fastest path to checkout for a returning student. */}
          {reorder}

          {/* Paid placement, high but below the reorder rail. */}
          {promos && promos.length > 0 ? (
            <PromoCarousel slides={promos} />
          ) : null}

          {featuredItems.length > 0 ? (
            <SectionRail
              title="Today's picks"
              subtitle="Hand-picked by the kitchens"
            >
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
            </SectionRail>
          ) : null}

          {categories.length > 0 ? (
            <SectionRail
              title="What are you craving?"
              subtitle="Browse by the kind of thing you fancy"
            >
              {categories.map((category) => {
                const cover = categoryCovers[category.id]
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({ ...f, categoryId: category.id }))
                    }
                    className="group w-card-craving shrink-0 text-left"
                  >
                    {/* A photograph of real food from that category, not an
                        icon: "Snacks" means nothing until you see the samosa. */}
                    <span className="relative block h-20 w-full overflow-hidden rounded-2xl bg-primary-soft">
                      {cover ? (
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="104px"
                          className="object-cover transition-transform duration-300 md:group-hover:scale-105"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <UtensilsCrossed className="h-6 w-6 text-primary" />
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block truncate text-center text-xs font-semibold text-foreground">
                      {category.name}
                    </span>
                  </button>
                )
              })}
            </SectionRail>
          ) : null}

          {openCanteens.length > 0 ? (
            <SectionRail
              title="Canteens on campus"
              subtitle="Open counters first"
            >
              {openCanteens.map((canteen) => (
                <CanteenRailCard
                  key={canteen.id}
                  canteen={canteen}
                  cuisines={Array.from(cuisinesByCanteen.get(canteen.id) ?? [])}
                />
              ))}
            </SectionRail>
          ) : null}

          {underHundred.length > 0 ? (
            <SectionRail
              title="Under ₹99"
              subtitle="Full meals that leave change"
              action={{
                label: "See all",
                onClick: () =>
                  setFilters((f) => ({ ...f, maxPrice: 99, minPrice: null })),
              }}
            >
              {underHundred.map((item) => (
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
            </SectionRail>
          ) : null}

          {quickBites.length > 0 ? (
            <SectionRail
              title="Quick pickup"
              subtitle={`Ready in about ${QUICK_MINUTES} minutes`}
              action={{
                label: "See all",
                onClick: () => setQuickOnly(true),
              }}
            >
              {quickBites.map((item) => (
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
            </SectionRail>
          ) : null}

          {studentFavourites.length > 0 ? (
            <SectionRail
              title="Student favourites"
              subtitle="Best rated on campus"
              action={{
                label: "See all",
                onClick: () => setFilters((f) => ({ ...f, sort: "rating" })),
              }}
            >
              {studentFavourites.map((item) => (
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
            </SectionRail>
          ) : null}

          {inlinePromo}

          <Section>
            <SectionHeader
              title="More from campus"
              subtitle={`Every canteen · ${matchedCanteens.length}`}
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
