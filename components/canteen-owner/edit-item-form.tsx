"use client"

import { useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { ImageUpload } from "@/components/ui/image-upload"

type Category = Database["public"]["Tables"]["categories"]["Row"]
type Item = Database["public"]["Tables"]["items"]["Row"]

interface EditItemFormProps {
  canteenId: string
  item: Item
  categories: Category[]
}

export function EditItemForm({ canteenId, item, categories }: EditItemFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: item.name,
    description: item.description || "",
    price: String(item.price),
    categoryId: item.category_id,
    imageUrl: item.image_url || "",
    isVegetarian: item.is_vegetarian,
  })
  const [galleryImages, setGalleryImages] = useState<string[]>(
    item.gallery_images || [],
  )
  const [showGalleryUploader, setShowGalleryUploader] = useState(false)

  const handleChange = (
    field: keyof typeof form,
    value: string | boolean,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error("Price must be greater than 0")
      return
    }
    if (!form.categoryId) {
      toast.error("Select a category")
      return
    }

    try {
      setLoading(true)
        const { error } = await supabase
        .from("items")
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: Number(form.price),
          category_id: form.categoryId,
          image_url: form.imageUrl || null,
          is_vegetarian: !!form.isVegetarian,
          gallery_images: galleryImages.length ? galleryImages : null,
        })
        .eq("id", item.id)
        .eq("canteen_id", canteenId)

      if (error) throw error

      toast.success("Item updated")
      router.push("/canteen/menu")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Item name"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Describe the dish..."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Price (₹)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => handleChange("categoryId", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2 max-w-md">
        <label className="text-sm font-medium">Image</label>
        <ImageUpload
          bucket="items"
          folder={canteenId}
          currentImageUrl={form.imageUrl}
          onUploadComplete={(url) => handleChange("imageUrl", url)}
          className="max-h-72"
        />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">Gallery Images</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowGalleryUploader(true)}
            disabled={galleryImages.length >= 4}
          >
            Add image
          </Button>
        </div>
        {showGalleryUploader && (
          <div className="mb-4 max-w-md">
            <ImageUpload
              bucket="items"
              folder="menu-gallery"
              onUploadComplete={(url) => {
                setGalleryImages((prev) => [...prev, url])
                setShowGalleryUploader(false)
              }}
              className="max-h-60"
            />
          </div>
        )}
        {galleryImages.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {galleryImages.map((img, idx) => (
              <div key={img} className="relative overflow-hidden rounded-lg border">
                <div className="relative h-40 w-full">
                  <Image src={img} alt={`gallery-${idx}`} fill className="object-cover" />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() =>
                    setGalleryImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!form.isVegetarian}
          onChange={(e) => handleChange("isVegetarian", e.target.checked)}
        />
        Mark as vegetarian
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="rounded-full">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}

