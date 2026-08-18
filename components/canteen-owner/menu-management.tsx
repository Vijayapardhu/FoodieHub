"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  UtensilsCrossed,
  X,
} from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chip, ChipRail } from "@/components/ui/chip"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/ui/empty-state"
import { VegMark } from "@/components/ui/status-badge"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { StickyBar, StickyBarSpacer } from "@/components/ui/sticky-bar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils/cn"
import { ownerItemEditPath } from "@/lib/utils/public-id"

type Item = Database["public"]["Tables"]["items"]["Row"] & {
  categories: { name: string } | null
}

interface MenuManagementProps {
  items: Item[]
  categories: Database["public"]["Tables"]["categories"]["Row"][]
  canteenId: string
}

type Availability = "all" | "available" | "hidden"
type View = "grid" | "list"

const VIEW_STORAGE_KEY = "foodiehub.menu-view"

export function MenuManagement({
  items: initialItems,
  categories,
}: MenuManagementProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [query, setQuery] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [availability, setAvailability] = useState<Availability>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [working, setWorking] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Photos are the thing an owner actually recognises a dish by, so the grid
  // is the default. The choice is remembered because it's a working
  // preference, not a per-visit decision — and it starts on the server value
  // so the first paint doesn't flip layouts.
  const [view, setView] = useState<View>("grid")

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (stored === "grid" || stored === "list") setView(stored)
  }, [])

  const changeView = (next: View) => {
    setView(next)
    window.localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  const usedCategories = useMemo(() => {
    const ids = new Set(items.map((item) => item.category_id))
    return categories.filter((category) => ids.has(category.id))
  }, [categories, items])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      if (categoryId && item.category_id !== categoryId) return false
      if (availability === "available" && !item.is_available) return false
      if (availability === "hidden" && item.is_available) return false
      if (needle && !item.name.toLowerCase().includes(needle)) return false
      return true
    })
  }, [items, query, categoryId, availability])

  const allVisibleSelected =
    visible.length > 0 && visible.every((item) => selected.has(item.id))

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(visible.map((i) => i.id)))
  }

  const setAvailabilityFor = async (ids: string[], value: boolean) => {
    if (ids.length === 0) return

    // Optimistic: the switch should feel instant behind a counter.
    const previous = items
    setItems((list) =>
      list.map((item) =>
        ids.includes(item.id) ? { ...item, is_available: value } : item
      )
    )
    setWorking(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("items")
        .update({ is_available: value })
        .in("id", ids)
      if (error) throw error

      toast.success(
        ids.length === 1
          ? value
            ? "Item is live"
            : "Item hidden"
          : `${ids.length} items ${value ? "made live" : "hidden"}`
      )
      setSelected(new Set())
      router.refresh()
    } catch (error: any) {
      setItems(previous)
      toast.error(error?.message || "Could not update those items")
    } finally {
      setWorking(false)
    }
  }

  const deleteItems = async (ids: string[]) => {
    const previous = items
    setItems((list) => list.filter((item) => !ids.includes(item.id)))
    setWorking(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("items").delete().in("id", ids)
      if (error) throw error

      toast.success(ids.length === 1 ? "Item deleted" : `${ids.length} items deleted`)
      setSelected(new Set())
      setDeleteTarget(null)
      setBulkDeleteOpen(false)
      router.refresh()
    } catch (error: any) {
      setItems(previous)
      toast.error(error?.message || "Could not delete those items")
    } finally {
      setWorking(false)
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="Your menu is empty"
        description="Add your first dish and students will be able to order it right away."
        action={{ label: "Add a dish", href: "/canteen/menu/new" }}
      />
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="search"
            inputMode="search"
            placeholder="Search your menu"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search menu items"
            className="flex-1"
            startAdornment={<Search />}
            endAdornment={
              query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
                >
                  <X />
                </button>
              ) : undefined
            }
          />

          {/* Segmented view switch. Two states, always both visible, so the
              alternative is discoverable without a menu. */}
          <div
            role="group"
            aria-label="Layout"
            className="flex shrink-0 rounded-xl border border-border bg-surface p-1"
          >
            {([
              { value: "grid" as const, icon: LayoutGrid, label: "Grid" },
              { value: "list" as const, icon: List, label: "List" },
            ]).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => changeView(value)}
                aria-pressed={view === value}
                aria-label={`${label} view`}
                title={`${label} view`}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  view === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* On desktop the header's Add button is a long way from the list,
              so the toolbar carries its own. */}
          <Button asChild className="hidden shrink-0 lg:inline-flex">
            <Link href="/canteen/menu/new">
              <Plus className="h-4 w-4" />
              Add dish
            </Link>
          </Button>
        </div>

        <ChipRail>
          <Chip
            active={availability === "all"}
            onClick={() => setAvailability("all")}
            count={items.length}
          >
            All
          </Chip>
          <Chip
            active={availability === "available"}
            onClick={() => setAvailability("available")}
            count={items.filter((i) => i.is_available).length}
          >
            Live
          </Chip>
          <Chip
            active={availability === "hidden"}
            onClick={() => setAvailability("hidden")}
            count={items.filter((i) => !i.is_available).length}
          >
            Hidden
          </Chip>
          {usedCategories.map((category) => (
            <Chip
              key={category.id}
              active={categoryId === category.id}
              onClick={() =>
                setCategoryId(categoryId === category.id ? null : category.id)
              }
            >
              {category.name}
            </Chip>
          ))}
        </ChipRail>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={visible.length === 0}
            className="text-sm font-semibold text-primary disabled:opacity-50"
          >
            {allVisibleSelected ? "Clear selection" : "Select all"}
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {visible.length} of {items.length}
          </span>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="Nothing matches"
            description="Try a different search term or clear the filters."
            action={{
              label: "Clear filters",
              onClick: () => {
                setQuery("")
                setCategoryId(null)
                setAvailability("all")
              },
            }}
            compact
          />
        ) : view === "grid" ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {visible.map((item) => {
              const checked = selected.has(item.id)
              return (
                <li
                  key={item.id}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-2xl border bg-card transition-colors",
                    checked ? "border-primary ring-2 ring-primary/25" : "border-border",
                    !item.is_available && "opacity-75"
                  )}
                >
                  <div className="relative aspect-[4/3] w-full bg-muted">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
                        className="object-cover"
                      />
                    ) : (
                      <ImagePlaceholder type="item" size="lg" />
                    )}

                    {/* Selection sits on the photo so the card body stays
                        readable, and stays visible once ticked. */}
                    <label
                      className={cn(
                        "absolute left-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-background/90 shadow-xs backdrop-blur-sm transition-opacity",
                        checked
                          ? "opacity-100"
                          : "opacity-0 focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(item.id)}
                        aria-label={`Select ${item.name}`}
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                      />
                    </label>

                    <span className="absolute right-2 top-2 flex items-center gap-1">
                      {item.is_featured ? (
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/90 shadow-xs backdrop-blur-sm">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        </span>
                      ) : null}
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/90 shadow-xs backdrop-blur-sm">
                        <VegMark vegetarian={item.is_vegetarian} />
                      </span>
                    </span>

                    {!item.is_available ? (
                      <span className="absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-0.5 text-2xs font-bold text-muted-foreground backdrop-blur-sm">
                        Hidden
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.categories?.name || "Uncategorised"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        ₹{Number(item.price)}
                      </span>
                      <Switch
                        checked={item.is_available}
                        onCheckedChange={(value) =>
                          setAvailabilityFor([item.id], value)
                        }
                        aria-label={`${item.name} availability`}
                      />
                    </div>

                    <div className="flex gap-1.5 border-t border-border pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        asChild
                      >
                        <Link href={ownerItemEditPath(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`Delete ${item.name}`}
                        className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <ul className="space-y-2">
            {visible.map((item) => {
              const checked = selected.has(item.id)
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors",
                    checked ? "border-primary bg-primary-soft" : "border-border",
                    !item.is_available && "opacity-70"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelect(item.id)}
                    aria-label={`Select ${item.name}`}
                    className="h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
                  />

                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <ImagePlaceholder type="item" size="sm" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <VegMark vegetarian={item.is_vegetarian} />
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.name}
                      </p>
                      {item.is_featured ? (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.categories?.name || "Uncategorised"} · ₹
                      {Number(item.price)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={(value) =>
                        setAvailabilityFor([item.id], value)
                      }
                      aria-label={`${item.name} availability`}
                    />
                    <Button size="icon-sm" variant="ghost" asChild>
                      <Link
                        href={ownerItemEditPath(item)}
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Delete ${item.name}`}
                      className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Bulk action bar — appears only once something is selected. The
          spacer keeps the last row(s) of the grid/list from ending up
          underneath it once it does. */}
      {selected.size > 0 ? <StickyBarSpacer /> : null}
      {selected.size > 0 ? (
        <StickyBar aboveTabBar context="console">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
              {selected.size} selected
            </span>
            <div className="flex flex-1 justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                loading={working}
                onClick={() =>
                  setAvailabilityFor(Array.from(selected), true)
                }
              >
                <Eye className="h-4 w-4" />
                Show
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={working}
                onClick={() =>
                  setAvailabilityFor(Array.from(selected), false)
                }
              >
                <EyeOff className="h-4 w-4" />
                Hide
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive-soft"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </StickyBar>
      ) : null}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{deleteTarget?.name}”?</DialogTitle>
            <DialogDescription>
              It disappears from your menu for good. To take it off temporarily
              instead, switch it to hidden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setDeleteTarget(null)}
              disabled={working}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              block
              loading={working}
              onClick={() => deleteTarget && deleteItems([deleteTarget.id])}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} items?</DialogTitle>
            <DialogDescription>
              All {selected.size} selected dishes are removed permanently. This
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setBulkDeleteOpen(false)}
              disabled={working}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              block
              loading={working}
              onClick={() => deleteItems(Array.from(selected))}
            >
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
