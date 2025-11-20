"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { Skeleton } from "@/components/ui/loading-state"

type Item = Database["public"]["Tables"]["items"]["Row"] & {
  canteens?: { name: string } | null
}

type Canteen = { id: string; name: string }

interface ItemsModerationTableProps {
  canteens: Canteen[]
  initialItems: Item[]
}

export function ItemsModerationTable({
  canteens,
  initialItems,
}: ItemsModerationTableProps) {
  const supabase = createClient()
  const [items, setItems] = useState(initialItems)
  const [selectedCanteen, setSelectedCanteen] = useState(
    canteens[0]?.id ?? "",
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedCanteen) return
      setLoading(true)
      const { data, error } = await supabase
        .from("items")
        .select("*, canteens(name)")
        .eq("canteen_id", selectedCanteen)
        .order("updated_at", { ascending: false })

      if (error) {
        toast.error(error.message)
      } else {
        setItems(data || [])
      }
      setLoading(false)
    }
    fetchItems()
  }, [selectedCanteen, supabase])

  const toggleFeatured = async (item: Item) => {
    const nextState = !item.is_featured
    const { error } = await supabase
      .from("items")
      .update({ is_featured: nextState })
      .eq("id", item.id)
    if (error) {
      toast.error(error.message || "Failed to update")
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_featured: nextState } : i)),
    )
    toast.success(
      nextState ? "Marked as featured" : "Removed from featured items",
    )
  }

  const updateFeaturedImage = async (itemId: string, url: string) => {
    const { error } = await supabase
      .from("items")
      .update({ featured_image_url: url || null })
      .eq("id", itemId)
    if (error) {
      toast.error(error.message || "Failed to update image")
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, featured_image_url: url || null } : i,
      ),
    )
    toast.success("Carousel image updated")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-sm font-medium">Select canteen</label>
        <select
          value={selectedCanteen}
          onChange={(e) => setSelectedCanteen(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm sm:max-w-xs"
        >
          {canteens.map((canteen) => (
            <option key={canteen.id} value={canteen.id}>
              {canteen.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No items for this canteen.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="space-y-4 p-4">
              <div className="flex gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-muted">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      No image
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm uppercase text-muted-foreground">
                    {item.canteens?.name}
                  </p>
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ₹{Number(item.price).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={item.is_featured ? "default" : "outline"}
                  onClick={() => toggleFeatured(item)}
                >
                  {item.is_featured ? "Featured" : "Mark featured"}
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Carousel image</p>
                <ImageUpload
                  bucket="items"
                  folder="featured"
                  currentImageUrl={item.featured_image_url || undefined}
                  onUploadComplete={(url) => updateFeaturedImage(item.id, url)}
                  className="max-h-56 max-w-md"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

