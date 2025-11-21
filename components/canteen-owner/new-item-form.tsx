"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

type Category = Database["public"]["Tables"]["categories"]["Row"]

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  category_id: z.string().min(1, "Category is required"),
  is_vegetarian: z.boolean().default(true),
  is_available: z.boolean().default(true),
})

interface NewItemFormProps {
  canteenId: string
  categories: Category[]
}

export function NewItemForm({ canteenId, categories }: NewItemFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [imageUrl, setImageUrl] = useState<string>("")
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [showGalleryUploader, setShowGalleryUploader] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category_id: "",
      is_vegetarian: true,
      is_available: true,
    },
  })

  const onSubmit = async (data: z.infer<typeof itemSchema>) => {
    try {
      setLoading(true)

      const { error } = await supabase.from("items").insert({
        canteen_id: canteenId,
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        category_id: data.category_id,
        image_url: imageUrl || null,
        is_vegetarian: data.is_vegetarian,
        is_available: data.is_available,
        gallery_images: galleryImages.length ? galleryImages : null,
      })

      if (error) throw error

      toast.success("Item created successfully")
      router.push("/canteen/menu")
    } catch (error: any) {
      toast.error(error.message || "Failed to create item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-4">
            <div className="w-full">
              <label className="mb-2 block text-sm font-medium">Item Image</label>
          <div className="max-w-md">
            <ImageUpload
              onUploadComplete={setImageUrl}
              bucket="items"
              folder="menu-items"
              aspectRatio="square"
              className="max-h-72"
            />
          </div>
            </div>
            
            {/* Gallery Images Section */}
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Gallery Images (optional)
              </label>
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
                <div className="max-w-md">
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
                  <div
                    key={img}
                    className="relative overflow-hidden rounded-lg border"
                  >
                    <div className="relative h-40 w-full">
                      <Image src={img} alt={`gallery-${idx}`} fill className="object-cover" />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                        className="absolute right-2 top-2 z-10 h-6 w-6"
                      onClick={() =>
                        setGalleryImages((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Item Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("name")}
              placeholder="e.g., Burger, Pizza"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">
                {errors.name.message as string}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium">Description</label>
            <Textarea
              {...register("description")}
              placeholder="Describe your item..."
              rows={4}
            />
          </div>

          {/* Price */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              {...register("price")}
              placeholder="0.00"
              className={errors.price ? "border-red-500" : ""}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-500">
                {errors.price.message as string}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register("category_id")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-1 text-sm text-red-500">
                {errors.category_id.message as string}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_vegetarian"
                {...register("is_vegetarian")}
                className="h-4 w-4"
              />
              <label htmlFor="is_vegetarian" className="text-sm font-medium">
                Vegetarian
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_available"
                defaultChecked
                {...register("is_available")}
                className="h-4 w-4"
              />
              <label htmlFor="is_available" className="text-sm font-medium">
                Available
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Item"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

