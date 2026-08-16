"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImagePlus, X } from "lucide-react"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/ui/image-upload"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { VegMark } from "@/components/ui/status-badge"
import { SwitchRow } from "@/components/ui/switch"
import { StickyBar } from "@/components/ui/sticky-bar"
import { MAX_GALLERY_IMAGES } from "@/lib/utils/constants"
import { cn } from "@/lib/utils/cn"

type Category = Database["public"]["Tables"]["categories"]["Row"]
type Item = Database["public"]["Tables"]["items"]["Row"]

interface ItemFormProps {
  canteenId: string
  categories: Category[]
  /** Omit to create a new dish. */
  item?: Item
}

interface FieldErrors {
  name?: string
  price?: string
  categoryId?: string
}

export function ItemForm({ canteenId, categories, item }: ItemFormProps) {
  const router = useRouter()
  const editing = Boolean(item)

  const [name, setName] = useState(item?.name ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [price, setPrice] = useState(item ? String(item.price) : "")
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "")
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "")
  const [gallery, setGallery] = useState<string[]>(item?.gallery_images ?? [])
  const [addingGallery, setAddingGallery] = useState(false)
  const [prepMinutes, setPrepMinutes] = useState(
    item?.prep_minutes ? String(item.prep_minutes) : ""
  )
  // Added by migration 027; the field waits for the column.
  const supportsPrepMinutes = item ? item.prep_minutes !== undefined : true
  const [isVegetarian, setIsVegetarian] = useState(item?.is_vegetarian ?? true)
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true)
  const [isFeatured, setIsFeatured] = useState(item?.is_featured ?? false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const validate = () => {
    const next: FieldErrors = {}
    if (!name.trim()) next.name = "Give the dish a name"
    if (!price || Number(price) <= 0) next.price = "Enter a price above zero"
    if (!categoryId) next.categoryId = "Pick a category"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) {
      toast.error("Check the highlighted fields")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        category_id: categoryId,
        image_url: imageUrl || null,
        gallery_images: gallery.length ? gallery : null,
        is_vegetarian: isVegetarian,
        is_available: isAvailable,
        is_featured: isFeatured,
        ...(supportsPrepMinutes
          ? { prep_minutes: prepMinutes ? Number(prepMinutes) : null }
          : {}),
      }

      if (editing && item) {
        const { error } = await supabase
          .from("items")
          .update(payload)
          .eq("id", item.id)
          .eq("canteen_id", canteenId)
        if (error) throw error
        toast.success("Dish updated")
      } else {
        const { error } = await supabase
          .from("items")
          .insert({ ...payload, canteen_id: canteenId })
        if (error) throw error
        toast.success("Dish added to your menu")
      }

      router.push("/canteen/menu")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not save this dish")
    } finally {
      setSaving(false)
    }
  }

  return (
    /*
     * One column on a phone, two from `lg` up. The right rail carries the
     * switches, a live preview of the card students will see, and the save
     * action — on a desktop screen that beats a single 700px column with a
     * bar floating at the bottom of a mostly empty window.
     */
    <form
      onSubmit={handleSubmit}
      className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-5 lg:space-y-0"
    >
      <div className="space-y-4">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Details</h2>

        <div className="space-y-1.5">
          <Label htmlFor="item-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Masala Dosa"
            invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "item-name-error" : undefined}
          />
          {errors.name ? (
            <p
              id="item-name-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="item-description">Description</Label>
          <Textarea
            id="item-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's in it, how it's served, spice level…"
            rows={3}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-price">
              Price (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="item-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? "item-price-error" : undefined}
            />
            {errors.price ? (
              <p
                id="item-price-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.price}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-category">
              Category <span className="text-destructive">*</span>
            </Label>
            <select
              id="item-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-invalid={Boolean(errors.categoryId) || undefined}
              aria-describedby={
                errors.categoryId ? "item-category-error" : undefined
              }
              className={cn(
                "h-12 w-full rounded-xl border bg-surface px-3.5 text-base text-foreground",
                "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15",
                errors.categoryId ? "border-destructive" : "border-input"
              )}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? (
              <p
                id="item-category-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.categoryId}
              </p>
            ) : null}
          </div>
        </div>

        {supportsPrepMinutes ? (
          <div className="space-y-1.5">
            <Label htmlFor="item-prep">Time to cook (minutes)</Label>
            <Input
              id="item-prep"
              type="number"
              inputMode="numeric"
              min={1}
              max={180}
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value)}
              placeholder="Canteen default"
            />
            <p className="text-xs text-muted-foreground">
              An order is quoted by its slowest dish, so this is what a student
              is told to wait when they order this. Blank uses your canteen
              default.
            </p>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Photos</h2>

        <div className="space-y-2">
          <Label>Main photo</Label>
          <ImageUpload
            bucket="items"
            folder={canteenId}
            currentImageUrl={imageUrl}
            onUploadComplete={setImageUrl}
            aspectRatio="square"
            label="Add the main photo"
            className="max-w-xs"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Gallery{" "}
              <span className="font-normal text-muted-foreground tabular-nums">
                {gallery.length}/{MAX_GALLERY_IMAGES}
              </span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddingGallery(true)}
              disabled={
                addingGallery || gallery.length >= MAX_GALLERY_IMAGES
              }
            >
              <ImagePlus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {addingGallery ? (
            <div className="max-w-xs">
              <ImageUpload
                bucket="items"
                folder={`${canteenId}/gallery`}
                onUploadComplete={(url) => {
                  if (url) setGallery((prev) => [...prev, url])
                  setAddingGallery(false)
                }}
                aspectRatio="square"
                label="Choose a photo"
              />
            </div>
          ) : null}

          {gallery.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {gallery.map((src, index) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden rounded-xl border border-border"
                >
                  <Image
                    src={src}
                    alt={`Gallery photo ${index + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGallery((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label={`Remove gallery photo ${index + 1}`}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      </div>

      <div className="space-y-4 lg:sticky lg:top-6">
        <section className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
          <SwitchRow
            label="Vegetarian"
            description="Shows the green veg mark to students"
            checked={isVegetarian}
            onCheckedChange={setIsVegetarian}
          />
          <SwitchRow
            label="Available"
            description="Off hides it from the menu without deleting it"
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
          />
          <SwitchRow
            label="Feature this dish"
            description="Promotes it on the home screen and your canteen page"
            checked={isFeatured}
            onCheckedChange={setIsFeatured}
          />
        </section>

        {/* Live preview. Owners are filling in fields for a card they can't
            see; this shows the result, including a name that's too long. */}
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">
            How students see it
          </h2>

          <div className="w-40 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-[4/3] w-full bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              ) : (
                <ImagePlaceholder type="item" size="lg" />
              )}
              <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-background/90 backdrop-blur-sm">
                <VegMark vegetarian={isVegetarian} />
              </span>
            </div>
            <div className="space-y-1 p-2.5">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                {name.trim() || "Dish name"}
              </p>
              <p className="text-sm font-bold tabular-nums text-foreground">
                ₹{price ? Number(price) : 0}
              </p>
            </div>
          </div>

          {!isAvailable ? (
            <p className="rounded-xl bg-warning-soft p-2.5 text-xs text-warning">
              Saved as hidden — it won&apos;t appear on the menu until you turn
              availability back on.
            </p>
          ) : null}
        </section>

        {/* Desktop actions live in the flow; the phone keeps the docked bar. */}
        <div className="hidden gap-2 lg:flex">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" className="flex-1" loading={saving}>
            {editing ? "Save changes" : "Add to menu"}
          </Button>
        </div>
      </div>

      <StickyBar aboveTabBar context="console" className="lg:hidden">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" className="flex-1" loading={saving}>
            {editing ? "Save changes" : "Add to menu"}
          </Button>
        </div>
      </StickyBar>
    </form>
  )
}
