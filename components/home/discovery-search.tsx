"use client"

import { useEffect, useState } from "react"
import { Search, X } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { FilterButton } from "@/components/home/home-filters"

/**
 * The search field, given the weight it deserves.
 *
 * The placeholder cycles through things that are genuinely on campus menus,
 * because "Search" alone tells a student nothing about what this box can
 * find. It changes only while the field is empty and unfocused — moving text
 * under a cursor is a good way to make someone lose their place — and holds
 * each suggestion long enough to be read rather than noticed.
 */
const SUGGESTIONS = [
  "Search “dosa”",
  "Search “biryani”",
  "Search “filter coffee”",
  "Search “Central Canteen”",
  "Search something delicious",
]

export function DiscoverySearch({
  value,
  onChange,
  onOpenFilters,
  activeFilterCount,
}: {
  value: string
  onChange: (value: string) => void
  onOpenFilters: () => void
  activeFilterCount: number
}) {
  const [index, setIndex] = useState(0)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (value || focused) return
    const timer = window.setInterval(
      () => setIndex((n) => (n + 1) % SUGGESTIONS.length),
      3200
    )
    return () => window.clearInterval(timer)
  }, [value, focused])

  return (
    <div className="flex items-center gap-2">
      <Input
        type="search"
        inputMode="search"
        placeholder={
          focused ? "Search dishes, canteens or cravings" : SUGGESTIONS[index]
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Search dishes, canteens or cravings"
        className="h-field rounded-2xl bg-surface text-base shadow-card"
        startAdornment={<Search />}
        endAdornment={
          value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            >
              <X />
            </button>
          ) : undefined
        }
      />
      <FilterButton count={activeFilterCount} onClick={onOpenFilters} />
    </div>
  )
}
