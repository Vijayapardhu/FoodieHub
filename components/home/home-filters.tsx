"use client"

import { SlidersHorizontal } from "lucide-react"
import { Database } from "@/types/database.types"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Input } from "@/components/ui/input"
import { SwitchRow } from "@/components/ui/switch"
import { cn } from "@/lib/utils/cn"

type Category = Database["public"]["Tables"]["categories"]["Row"]

export type SortKey =
  | "relevance"
  | "rating"
  | "price-asc"
  | "price-desc"
  | "name"

export interface BrowseFilters {
  categoryId: string | null
  minPrice: number | null
  maxPrice: number | null
  minRating: number | null
  vegOnly: boolean
  openOnly: boolean
  sort: SortKey
}

export const defaultFilters: BrowseFilters = {
  categoryId: null,
  minPrice: null,
  maxPrice: null,
  minRating: null,
  vegOnly: false,
  openOnly: false,
  sort: "relevance",
}

export function countActiveFilters(filters: BrowseFilters): number {
  let n = 0
  if (filters.categoryId) n++
  if (filters.minPrice !== null || filters.maxPrice !== null) n++
  if (filters.minRating !== null) n++
  if (filters.vegOnly) n++
  if (filters.openOnly) n++
  if (filters.sort !== "relevance") n++
  return n
}

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: "relevance", label: "Relevance" },
  { key: "rating", label: "Top rated" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
  { key: "name", label: "A–Z" },
]

const ratingOptions = [4, 3, 2] as const

interface FilterSheetProps {
  categories: Category[]
  value: BrowseFilters
  onChange: (filters: BrowseFilters) => void
  /** Hide controls that only apply when browsing canteens. */
  scope?: "browse" | "menu"
  open: boolean
  onOpenChange: (open: boolean) => void
  children?: React.ReactNode
}

export function FilterSheet({
  categories,
  value,
  onChange,
  scope = "browse",
  open,
  onOpenChange,
  children,
}: FilterSheetProps) {
  const set = <K extends keyof BrowseFilters>(
    key: K,
    next: BrowseFilters[K]
  ) => onChange({ ...value, [key]: next })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children ? <SheetTrigger asChild>{children}</SheetTrigger> : null}

      <SheetContent side="bottom" className="max-h-[85dvh]">
        <SheetHeader className="pr-12">
          <SheetTitle>Filters &amp; sorting</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-6 pb-4">
          <fieldset className="space-y-2">
            <legend className="muted-label mb-2">Sort by</legend>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <Chip
                  key={option.key}
                  active={value.sort === option.key}
                  onClick={() => set("sort", option.key)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          {categories.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className="muted-label mb-2">Category</legend>
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={value.categoryId === null}
                  onClick={() => set("categoryId", null)}
                >
                  All
                </Chip>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    active={value.categoryId === category.id}
                    onClick={() =>
                      set(
                        "categoryId",
                        value.categoryId === category.id ? null : category.id
                      )
                    }
                  >
                    {category.name}
                  </Chip>
                ))}
              </div>
            </fieldset>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="muted-label mb-2">Price range (₹)</legend>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Min"
                value={value.minPrice ?? ""}
                onChange={(e) =>
                  set(
                    "minPrice",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Max"
                value={value.maxPrice ?? ""}
                onChange={(e) =>
                  set(
                    "maxPrice",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="muted-label mb-2">Minimum rating</legend>
            <div className="flex flex-wrap gap-2">
              <Chip
                active={value.minRating === null}
                onClick={() => set("minRating", null)}
              >
                Any
              </Chip>
              {ratingOptions.map((rating) => (
                <Chip
                  key={rating}
                  active={value.minRating === rating}
                  onClick={() =>
                    set("minRating", value.minRating === rating ? null : rating)
                  }
                >
                  {rating}★ &amp; up
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="divide-y divide-border rounded-2xl border border-border px-4">
            <SwitchRow
              label="Vegetarian only"
              description="Hide every non-veg dish"
              checked={value.vegOnly}
              onCheckedChange={(checked) => set("vegOnly", checked)}
            />
            {scope === "browse" ? (
              <SwitchRow
                label="Open now"
                description="Only canteens currently serving"
                checked={value.openOnly}
                onCheckedChange={(checked) => set("openOnly", checked)}
              />
            ) : null}
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="outline"
            block
            onClick={() => onChange(defaultFilters)}
          >
            Reset
          </Button>
          <Button block onClick={() => onOpenChange(false)}>
            Show results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/** The button that opens the sheet, with a badge for the active filter count. */
export function FilterButton({
  count,
  onClick,
  className,
}: {
  count: number
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        count > 0 ? `Filters, ${count} active` : "Filters and sorting"
      }
      className={cn(
        "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors active:scale-95",
        count > 0
          ? "border-primary bg-primary-soft text-primary"
          : "border-input bg-surface text-muted-foreground",
        className
      )}
    >
      <SlidersHorizontal className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      ) : null}
    </button>
  )
}
