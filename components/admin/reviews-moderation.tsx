"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { MessagesSquare, Search, Trash2, X } from "lucide-react"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chip, ChipRail } from "@/components/ui/chip"
import { StarRating } from "@/components/ui/star-rating"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDebounce } from "@/lib/hooks/use-debounce"

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  users: { full_name: string | null; email: string } | null
  canteens: { name: string } | null
  items: { name: string } | null
}

type Filter = "all" | "critical" | "unanswered"

export function ReviewsModeration({
  reviews: initialReviews,
}: {
  reviews: Review[]
}) {
  const router = useRouter()
  const [reviews, setReviews] = useState(initialReviews)
  const [rawQuery, setRawQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null)
  const [working, setWorking] = useState(false)

  const query = useDebounce(rawQuery, 180).trim().toLowerCase()

  const counts = useMemo(
    () => ({
      all: reviews.length,
      critical: reviews.filter((r) => r.rating <= 2).length,
      unanswered: reviews.filter((r) => !r.owner_response).length,
    }),
    [reviews]
  )

  const visible = useMemo(
    () =>
      reviews.filter((review) => {
        if (filter === "critical" && review.rating > 2) return false
        if (filter === "unanswered" && review.owner_response) return false
        if (!query) return true
        return (
          review.comment?.toLowerCase().includes(query) ||
          review.canteens?.name.toLowerCase().includes(query) ||
          review.items?.name.toLowerCase().includes(query) ||
          review.users?.email.toLowerCase().includes(query) ||
          review.users?.full_name?.toLowerCase().includes(query)
        )
      }),
    [reviews, filter, query]
  )

  const remove = async () => {
    if (!deleteTarget) return
    setWorking(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", deleteTarget.id)
      if (error) throw error

      setReviews((list) => list.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success("Review removed")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not remove that review")
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-3">
      <Input
        type="search"
        inputMode="search"
        placeholder="Search reviews, canteens or students"
        value={rawQuery}
        onChange={(e) => setRawQuery(e.target.value)}
        aria-label="Search reviews"
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

      <ChipRail>
        {(
          [
            ["all", "All"],
            ["critical", "1–2 stars"],
            ["unanswered", "No reply"],
          ] as const
        ).map(([key, label]) => (
          <Chip
            key={key}
            active={filter === key}
            onClick={() => setFilter(key)}
            count={counts[key]}
          >
            {label}
          </Chip>
        ))}
      </ChipRail>

      {visible.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No reviews here"
          description="Nothing matches this filter right now."
          compact
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visible.map((review) => (
            <li
              key={review.id}
              className="space-y-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {review.users?.full_name || review.users?.email || "Student"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {review.canteens?.name || review.items?.name || "Unknown"} ·{" "}
                    {format(new Date(review.created_at), "d MMM yyyy")}
                  </p>
                  <StarRating value={review.rating} className="mt-1" />
                </div>

                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(review)}
                  aria-label="Remove review"
                  className="shrink-0 text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {review.comment ? (
                <p className="text-sm text-foreground">{review.comment}</p>
              ) : null}

              {review.photos?.length ? (
                <div className="flex gap-2">
                  {review.photos.slice(0, 4).map((photo) => (
                    <span
                      key={photo}
                      className="relative h-14 w-14 overflow-hidden rounded-xl border border-border"
                    >
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </span>
                  ))}
                </div>
              ) : null}

              {review.owner_response ? (
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs font-semibold text-foreground">
                    Canteen replied
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {review.owner_response}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this review?</DialogTitle>
            <DialogDescription>
              Use this for abuse or spam only — genuine criticism should stay up.
              The canteen&apos;s rating is recalculated without it.
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
              onClick={remove}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
