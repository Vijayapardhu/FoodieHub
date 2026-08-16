"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "@/components/ui/icons"
import Image from "next/image"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
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

export interface ItemReview {
  id: string
  itemId: string
  rating: number
}

interface FeedbackFormProps {
  order: Order
  /** Ratings this student has already given the individual dishes. */
  existingItemReviews?: ItemReview[]
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

export function FeedbackForm({
  order,
  existingReview,
  existingItemReviews = [],
}: FeedbackFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? "")
  const [photos, setPhotos] = useState<string[]>(existingReview?.photos ?? [])

  // One line per dish, deduplicated: the same dish ordered twice is still one
  // thing to have an opinion about.
  const dishes = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; imageUrl: string | null }>()
    for (const line of order.order_items ?? []) {
      const item = line.items
      if (!item || seen.has(item.id)) continue
      seen.set(item.id, {
        id: item.id,
        name: item.name,
        imageUrl: item.image_url ?? null,
      })
    }
    return Array.from(seen.values())
  }, [order.order_items])

  const [itemRatings, setItemRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(existingItemReviews.map((r) => [r.itemId, r.rating]))
  )
  const [saving, setSaving] = useState(false)

  /**
   * Bring the per-dish ratings in line with what is on screen.
   *
   * Three cases, not one: a dish newly rated, a rating changed, and a rating
   * cleared. The cleared case has to delete the row rather than store a zero —
   * the rating column only accepts 1 to 5, and a dish nobody rated should not
   * count towards its own average.
   *
   * These rows carry item_id and no canteen_id. Setting both would make one
   * order contribute a dozen reviews to the canteen's count, which is how a
   * rating stops meaning anything.
   */
  const syncItemReviews = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const existing = new Map(existingItemReviews.map((r) => [r.itemId, r]))

    const inserts: Array<Record<string, unknown>> = []
    const removals: string[] = []

    for (const dish of dishes) {
      const rating = itemRatings[dish.id] ?? 0
      const previous = existing.get(dish.id)

      if (rating === 0) {
        if (previous) removals.push(previous.id)
        continue
      }
      if (previous) {
        if (previous.rating !== rating) {
          const { error } = await supabase
            .from("reviews")
            .update({ rating, updated_at: new Date().toISOString() })
            .eq("id", previous.id)
          if (error) throw error
        }
        continue
      }
      inserts.push({
        user_id: user.id,
        item_id: dish.id,
        order_id: order.id,
        rating,
      })
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from("reviews").insert(inserts as any)
      if (error) throw error
    }
    if (removals.length > 0) {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .in("id", removals)
      if (error) throw error
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

      await syncItemReviews()

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

      {dishes.length > 0 ? (
        <section className="space-y-1 rounded-2xl border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Rate the dishes
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Optional, and per dish — a great biryani and a cold chai deserve
              different scores.
            </p>
          </div>

          <ul className="divide-y divide-border">
            {dishes.map((dish) => (
              <li key={dish.id} className="flex items-center gap-3 py-2.5">
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {dish.imageUrl ? (
                    <Image
                      src={dish.imageUrl}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder type="item" size="sm" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  {dish.name}
                </span>
                <StarPicker
                  size="sm"
                  value={itemRatings[dish.id] ?? 0}
                  onChange={(value) =>
                    setItemRatings((current) => ({
                      ...current,
                      // Tapping the same star again clears it, which is the
                      // only way back to "no opinion" once one is given.
                      [dish.id]: current[dish.id] === value ? 0 : value,
                    }))
                  }
                  className="shrink-0"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
