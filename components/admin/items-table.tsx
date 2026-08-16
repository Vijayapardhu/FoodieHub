"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Search, Star, UtensilsCrossed, X } from "lucide-react"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/ui/empty-state"
import { CardGridSkeleton } from "@/components/ui/loading-state"
import { ImageUpload } from "@/components/ui/image-upload"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { VegMark } from "@/components/ui/status-badge"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useDebounce } from "@/lib/hooks/use-debounce"

type Item = Database["public"]["Tables"]["items"]["Row"] & {
  canteens?: { name: string } | null
}

interface ItemsModerationTableProps {
  canteens: Array<{ id: string; name: string }>
  initialItems: Item[]
}

/**
 * Admin view for curating what gets promoted. Owners control their own menus;
 * this screen only governs featuring and the carousel artwork.
 */
export function ItemsModerationTable({
  canteens,
  initialItems,
}: ItemsModerationTableProps) {
  const [items, setItems] = useState(initialItems)
  const [selectedCanteen, setSelectedCanteen] = useState(canteens[0]?.id ?? "")
  const [rawQuery, setRawQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [artworkTarget, setArtworkTarget] = useState<Item | null>(null)

  const query = useDebounce(rawQuery, 180).trim().toLowerCase()

  const fetchItems = useCallback(async () => {
    if (!selectedCanteen) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("items")
        .select("*, canteens(name)")
        .eq("canteen_id", selectedCanteen)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setItems(data ?? [])
    } catch (error: any) {
      toast.error(error?.message || "Could not load that menu")
    } finally {
      setLoading(false)
    }
  }, [selectedCanteen])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const setFeatured = async (item: Item, value: boolean) => {
    const previous = items
    setItems((list) =>
      list.map((entry) =>
        entry.id === item.id ? { ...entry, is_featured: value } : entry
      )
    )

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("items")
        .update({ is_featured: value })
        .eq("id", item.id)
      if (error) throw error

      toast.success(
        value ? `${item.name} is now featured` : `${item.name} unfeatured`
      )
    } catch (error: any) {
      setItems(previous)
      toast.error(error?.message || "Could not update that dish")
    }
  }

  const setArtwork = async (item: Item, url: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("items")
        .update({ featured_image_url: url || null })
        .eq("id", item.id)
      if (error) throw error

      setItems((list) =>
        list.map((entry) =>
          entry.id === item.id
            ? { ...entry, featured_image_url: url || null }
            : entry
        )
      )
      toast.success("Carousel artwork updated")
    } catch (error: any) {
      toast.error(error?.message || "Could not update the artwork")
    }
  }

  const visible = items.filter((item) =>
    query ? item.name.toLowerCase().includes(query) : true
  )

  if (canteens.length === 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="No canteens yet"
        description="Approve a canteen first and its menu will appear here."
        action={{ label: "Go to canteens", href: "/admin/canteens" }}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="space-y-1.5 sm:w-64">
          <Label htmlFor="canteen-picker" className="sr-only">
            Canteen
          </Label>
          <select
            id="canteen-picker"
            value={selectedCanteen}
            onChange={(e) => setSelectedCanteen(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-surface px-3.5 text-base font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
          >
            {canteens.map((canteen) => (
              <option key={canteen.id} value={canteen.id}>
                {canteen.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          type="search"
          inputMode="search"
          placeholder="Search this menu"
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          aria-label="Search menu items"
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
      </div>

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Nothing on this menu"
          description="This canteen hasn't published any dishes matching your search."
          compact
        />
      ) : (
        <ul className="grid gap-2 lg:grid-cols-2">
          {visible.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
            >
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {item.featured_image_url || item.image_url ? (
                  <Image
                    src={(item.featured_image_url || item.image_url)!}
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
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  ₹{Number(item.price).toFixed(2)}
                  {item.is_available ? "" : " · hidden by owner"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setArtworkTarget(item)}
                >
                  Artwork
                </Button>
                <label className="flex flex-col items-center gap-1">
                  <span className="sr-only">Feature {item.name}</span>
                  <Switch
                    checked={item.is_featured}
                    onCheckedChange={(value) => setFeatured(item, value)}
                  />
                  <Star
                    className={
                      item.is_featured
                        ? "h-3 w-3 fill-warning text-warning"
                        : "h-3 w-3 text-muted-foreground"
                    }
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={artworkTarget !== null}
        onOpenChange={(open) => !open && setArtworkTarget(null)}
      >
        <SheetContent side="bottom">
          <SheetHeader className="pr-12">
            <SheetTitle>Carousel artwork</SheetTitle>
          </SheetHeader>

          <SheetBody className="space-y-3 pb-6">
            <p className="text-sm text-muted-foreground">
              Shown on the home carousel for{" "}
              <strong className="text-foreground">{artworkTarget?.name}</strong>.
              Leave it empty to fall back to the dish photo.
            </p>

            {artworkTarget ? (
              <ImageUpload
                bucket="items"
                folder="featured"
                currentImageUrl={artworkTarget.featured_image_url ?? undefined}
                onUploadComplete={(url) => setArtwork(artworkTarget, url)}
                aspectRatio="banner"
                label="Upload carousel artwork"
              />
            ) : null}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  )
}
