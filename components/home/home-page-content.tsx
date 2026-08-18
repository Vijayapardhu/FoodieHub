"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Store, UtensilsCrossed, X } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { Input } from "@/components/ui/input"
import { Chip, ChipRail } from "@/components/ui/chip"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/ui/empty-state"
import { Section, SectionHeader } from "@/components/ui/section-header"
import { CanteenCard } from "@/components/canteen/canteen-card"
import { ItemCard } from "@/components/menu/item-card"
import { cn } from "@/lib/utils/cn"
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

  /*
   * How tall the pinned search block is, published as a custom property so the
   * category rail further down the page knows where to come to rest.
   *
   * Measured rather than hard-coded: the block grows and shrinks with the veg
   * toggle and with text size, and a magic number would put the categories
   * either under the search box or floating below it. A ResizeObserver costs
   * nothing here — unlike a scroll listener, it fires only when the box
   * actually changes size.
   */
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    const node = headerRef.current
    if (!node) return
    const observer = new ResizeObserver(() => setHeaderHeight(node.offsetHeight))
    observer.observe(node)
    setHeaderHeight(node.offsetHeight)
    return () => observer.disconnect()
  }, [])
  /** "Fast pickup" — dishes the kitchen can turn round quickly. */
  const [quickOnly, setQuickOnly] = useState(false)

  // An admin-set category image wins when there is one. Otherwise the tile
  // borrows the photo of the category's best-rated dish — food the canteens
  // actually serve — rather than sitting on the generic icon while nobody
  // has gotten round to uploading a picture.
  const categoryCovers = useMemo(() => {
    const best: Record<string, { url: string; rating: number }> = {}
    for (const item of items) {
      if (!item.image_url || !item.category_id) continue
      const current = best[item.category_id]
      if (!current || item.rating > current.rating) {
        best[item.category_id] = { url: item.image_url, rating: item.rating }
      }
    }
    return Object.fromEntries(Object.entries(best).map(([id, v]) => [id, v.url])) as Record<
      string,
      string
    >
  }, [items])

  // Typing filters a client-side list, so a short debounce is enough to stop
  // re-sorting the whole catalogue on every keystroke.
  const query = useDebounce(rawQuery, 180).trim().toLowerCase()
  const searching = query.length > 0
  const activeCount = countActiveFilters(filters)

  const matchedCanteens = useMemo(() => {
    let list = canteens

    if (filters.openOnly) list = list.filter((c) => c.is_open)
    if (filters.minRating !== null) list = list.filter((c) => c.rating >= filters.minRating!)
    if (query)
      list = list.filter(
        (c) => c.name.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query)
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

    if (filters.categoryId) list = list.filter((i) => i.category_id === filters.categoryId)
    if (filters.vegOnly) list = list.filter((i) => i.is_vegetarian)
    if (filters.openOnly) list = list.filter((i) => i.canteens?.is_open)
    if (filters.minPrice !== null) list = list.filter((i) => Number(i.price) >= filters.minPrice!)
    if (filters.maxPrice !== null) list = list.filter((i) => Number(i.price) <= filters.maxPrice!)
    if (filters.minRating !== null) list = list.filter((i) => i.rating >= filters.minRating!)
    if (quickOnly) list = list.filter((i) => (i.prep_minutes ?? 99) <= QUICK_MINUTES)
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
  // Veg mode is applied at the source rather than per rail, so switching it
  // on empties the meat out of every collection on the page. A "mode" that
  // only filtered the search results would be a filter wearing a mode's name.
  const orderable = useMemo(
    () =>
      items.filter(
        (item) => item.canteens?.is_open !== false && (!filters.vegOnly || item.is_vegetarian)
      ),
    [items, filters.vegOnly]
  )

  const featured = useMemo(
    () => (filters.vegOnly ? featuredItems.filter((item) => item.is_vegetarian) : featuredItems),
    [featuredItems, filters.vegOnly]
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
      [...canteens].sort((a, b) => Number(b.is_open) - Number(a.is_open) || b.rating - a.rating),
    [canteens]
  )

  const clearAll = () => {
    setRawQuery("")
    setFilters(defaultFilters)
    setQuickOnly(false)
  }

  return (
    <div
      className="space-y-7"
      style={{ "--fh-pinned": `${headerHeight}px` } as React.CSSProperties}
    >
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
      <div
        ref={headerRef}
        className="sticky top-[calc(theme(spacing.appbar)+env(safe-area-inset-top))] z-30 -mx-4 !mt-3 bg-background/95 px-4 py-2 backdrop-blur-md sm:-mx-5 sm:px-5"
      >
        <DiscoverySearch
          value={rawQuery}
          onChange={setRawQuery}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={activeCount}
        />
      </div>

      {/*
       * Veg mode, not a veg filter: it holds for the whole session rather
       * than being re-applied per search, and it filters the rails at the
       * source rather than only the results.
       */}
      <label className="!mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-veg bg-surface"
          >
            <span className="h-2 w-2 rounded-full bg-veg" />
          </span>
          <span className="truncate text-sm font-semibold text-foreground">Pure veg mode</span>
        </span>
        <Switch
          checked={filters.vegOnly}
          onCheckedChange={(on) => setFilters((f) => ({ ...f, vegOnly: on }))}
          aria-label="Show vegetarian dishes only"
          className="h-6 w-11 shrink-0 [&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-5"
        />
      </label>

      {/* Deliberately not sticky. These are occasional refinements, not
          navigation, and a second pinned row would cost more screen than it
          earns. */}
      <div className="!mt-3">
        <ChipRail>
          <Chip
            active={filters.openOnly}
            onClick={() => setFilters((f) => ({ ...f, openOnly: !f.openOnly }))}
          >
            Open now
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
          <Chip active={quickOnly} onClick={() => setQuickOnly((on) => !on)}>
            Fast pickup
          </Chip>
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
            subtitle={`${matchedItems.length} ${matchedItems.length === 1 ? "dish" : "dishes"}${
              matchedCanteens.length && searching ? ` · ${matchedCanteens.length} canteens` : ""
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
          {/* The paid slot leads. It is the platform's inventory and the most
              valuable position on the page, and the reorder rail directly
              under it still sits above everything a student has to browse
              for — so the fastest path to checkout costs one glance, not a
              scroll. */}
          {promos && promos.length > 0 ? <PromoCarousel slides={promos} /> : null}

          {/* Fastest path to checkout for a returning student. */}
          {reorder}

          {featured.length > 0 ? (
            <SectionRail title="Today's picks" subtitle="Hand-picked by the kitchens">
              {featured.map((item) => (
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

          {/*
           * The categories keep their place on the page and pin to the search
           * bar once it is reached — plain CSS sticky, so the browser owns the
           * hand-off. The previous version watched the scroll position and
           * animated a collapse, which flickered whenever a scroll changed
           * direction mid-animation.
           *
           * The offset is the app bar plus whatever the pinned search block
           * currently measures, published above as --fh-pinned.
           */}
          <div className="sticky top-[calc(theme(spacing.appbar)+env(safe-area-inset-top)+var(--fh-pinned,0px))] z-20 -mx-4 bg-background/95 px-4 py-1 backdrop-blur-md sm:-mx-5 sm:px-5">
            {categories.length > 0 ? (
              <div className="rail rail-inset pb-1 pt-2.5">
                {categories.map((category) => {
                  const cover = category.image_url || categoryCovers[category.id]
                  const active = filters.categoryId === category.id
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          categoryId: active ? null : category.id,
                        }))
                      }
                      aria-pressed={active}
                      className="group w-card-craving shrink-0 text-left"
                    >
                      {/* A photograph of real food from that category, not an
                        icon: "Snacks" means nothing until you see the samosa. */}
                      <span
                        className={cn(
                          "relative block aspect-square w-full overflow-hidden rounded-2xl bg-primary-soft ring-2 transition-all",
                          active ? "ring-primary" : "ring-transparent"
                        )}
                      >
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
                      <span
                        className={cn(
                          "mt-1.5 block truncate text-center text-xs font-semibold",
                          active ? "text-primary" : "text-foreground"
                        )}
                      >
                        {category.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          {openCanteens.length > 0 ? (
            <SectionRail title="Canteens on campus" subtitle="Open counters first">
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
                onClick: () => setFilters((f) => ({ ...f, maxPrice: 99, minPrice: null })),
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
                title={canteens.length === 0 ? "No canteens yet" : "Nothing matches those filters"}
                description={
                  canteens.length === 0
                    ? "Once a canteen is approved it will show up here."
                    : "Try turning off “Open now”, or widen the rating filter."
                }
                action={
                  canteens.length === 0 ? undefined : { label: "Clear filters", onClick: clearAll }
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
