"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarPicker } from "@/components/ui/star-rating"
import { StickyBar } from "@/components/ui/sticky-bar"
import { orderPath } from "@/lib/utils/public-id"
import { ReviewPhotoPicker } from "@/components/reviews/review-photo-picker"

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

const ratingLabels: Record<number, string> = {
  1: "Bad — something went wrong",
  2: "Poor — needs work",
  3: "Okay — did the job",
  4: "Good — would order again",
  5: "Excellent — loved it",
}

export function FeedbackForm({ order, existingReview }: FeedbackFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? "")
  const [photos, setPhotos] = useState<string[]>(existingReview?.photos ?? [])
  const [saving, setSaving] = useState(false)

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

      <ReviewPhotoPicker
        photos={photos}
        onChange={setPhotos}
        pathPrefix={`reviews/${order.id}`}
      />

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
