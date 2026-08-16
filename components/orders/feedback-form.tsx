"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, X } from "lucide-react"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarPicker } from "@/components/ui/star-rating"
import { StickyBar } from "@/components/ui/sticky-bar"
import { orderPath } from "@/lib/utils/public-id"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
}

interface FeedbackFormProps {
  order: Order
  existingReview:
    | {
        id: string
        rating: number
        comment: string | null
        photos: string[] | null
      }
    | null
}

const MAX_PHOTOS = 4
const REVIEW_BUCKET = "reviews"

const ratingLabels: Record<number, string> = {
  1: "Bad — something went wrong",
  2: "Poor — needs work",
  3: "Okay — did the job",
  4: "Good — would order again",
  5: "Excellent — loved it",
}

export function FeedbackForm({ order, existingReview }: FeedbackFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? "")
  const [photos, setPhotos] = useState<string[]>(existingReview?.photos ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handlePhotoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files?.length) return

    const slots = MAX_PHOTOS - photos.length
    if (slots <= 0) {
      toast.error(`Up to ${MAX_PHOTOS} photos`)
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const uploaded: string[] = []

      for (const file of Array.from(files).slice(0, slots)) {
        if (!file.type.startsWith("image/")) continue

        const fileExt = file.name.split(".").pop()
        const filePath = `reviews/${order.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`

        const { error } = await supabase.storage
          .from(REVIEW_BUCKET)
          .upload(filePath, file, { cacheControl: "3600", upsert: false })
        if (error) throw error

        const {
          data: { publicUrl },
        } = supabase.storage.from(REVIEW_BUCKET).getPublicUrl(filePath)
        uploaded.push(publicUrl)
      }

      if (uploaded.length > 0) {
        setPhotos((prev) => [...prev, ...uploaded])
      }
    } catch (error: any) {
      toast.error(error?.message || "Could not upload those photos")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (rating === 0) {
      toast.error("Pick a star rating first")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      if (existingReview) {
        const { error } = await supabase
          .from("reviews")
          .update({
            rating,
            comment: comment.trim() || null,
            photos: photos.length ? photos : [],
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingReview.id)
        if (error) throw error
        toast.success("Review updated")
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Please log in again")

        const { error } = await supabase.from("reviews").insert({
          user_id: user.id,
          canteen_id: order.canteen_id,
          order_id: order.id,
          rating,
          comment: comment.trim() || null,
          photos: photos.length ? photos : [],
        })
        if (error) throw error
        toast.success("Thanks for the review")
      }

      router.push(orderPath(order))
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not save your review")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">
          {order.canteens?.name ?? "Canteen"}
        </p>
        <p className="text-xs text-muted-foreground">
          Token #{order.token} · {order.order_items?.length ?? 0} items · ₹
          {Number(order.total_amount).toFixed(2)}
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 text-center">
        <h2 className="text-sm font-semibold text-foreground">
          How was your order?
        </h2>
        <div className="flex justify-center">
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <p className="min-h-5 text-sm text-muted-foreground">
          {ratingLabels[rating] ?? "Tap a star to rate"}
        </p>
      </section>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <label
          htmlFor="review-comment"
          className="text-sm font-semibold text-foreground"
        >
          Tell them more{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Taste, portion size, wait time, packaging…"
          rows={5}
          maxLength={1000}
        />
        <p className="text-right text-xs text-muted-foreground tabular-nums">
          {comment.length}/1000
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Photos</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {photos.length}/{MAX_PHOTOS}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo}
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
            >
              <Image
                src={photo}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setPhotos((prev) => prev.filter((p) => p !== photo))
                }
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors active:border-primary"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
              <span className="text-2xs font-semibold">
                {uploading ? "Uploading" : "Add"}
              </span>
            </button>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoSelect}
        />
      </section>

      <StickyBar>
        <Button
          type="submit"
          size="lg"
          block
          loading={saving}
          disabled={rating === 0}
        >
          {existingReview ? "Update review" : "Post review"}
        </Button>
      </StickyBar>
    </form>
  )
}
