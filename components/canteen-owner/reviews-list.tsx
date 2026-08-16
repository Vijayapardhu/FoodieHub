"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MessageSquare, Star } from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Chip, ChipRail } from "@/components/ui/chip"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/ui/star-rating"
import { EmptyState } from "@/components/ui/empty-state"

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  users: { full_name: string | null; email: string; avatar_url?: string | null } | null
}

interface ReviewsListProps {
  reviews: Review[]
  canteenId: string
}

type Filter = "all" | "unanswered" | "critical"

export function ReviewsList({ reviews }: ReviewsListProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [response, setResponse] = useState("")
  const [saving, setSaving] = useState(false)

  const stats = useMemo(() => {
    const total = reviews.length
    const average =
      total === 0
        ? 0
        : reviews.reduce((sum, review) => sum + review.rating, 0) / total
    return {
      total,
      average,
      unanswered: reviews.filter((r) => !r.owner_response).length,
      critical: reviews.filter((r) => r.rating <= 2).length,
    }
  }, [reviews])

  const visible = useMemo(() => {
    if (filter === "unanswered")
      return reviews.filter((review) => !review.owner_response)
    if (filter === "critical")
      return reviews.filter((review) => review.rating <= 2)
    return reviews
  }, [reviews, filter])

  const postResponse = async (reviewId: string) => {
    if (!response.trim()) {
      toast.error("Write a reply first")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("reviews")
        .update({
          owner_response: response.trim(),
          owner_response_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
      if (error) throw error

      toast.success("Reply posted")
      setRespondingTo(null)
      setResponse("")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not post your reply")
    } finally {
      setSaving(false)
    }
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No reviews yet"
        description="Once students rate a collected order, their feedback lands here."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="text-center">
          <p className="text-3xl font-black tabular-nums text-foreground">
            {stats.average.toFixed(1)}
          </p>
          <StarRating value={stats.average} />
        </div>
        <div className="h-12 w-px bg-border" />
        <dl className="flex-1 space-y-0.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total reviews</dt>
            <dd className="font-semibold tabular-nums">{stats.total}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Awaiting a reply</dt>
            <dd className="font-semibold tabular-nums">{stats.unanswered}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">2 stars or below</dt>
            <dd className="font-semibold tabular-nums text-destructive">
              {stats.critical}
            </dd>
          </div>
        </dl>
      </div>

      <ChipRail>
        <Chip active={filter === "all"} onClick={() => setFilter("all")} count={stats.total}>
          All
        </Chip>
        <Chip
          active={filter === "unanswered"}
          onClick={() => setFilter("unanswered")}
          count={stats.unanswered}
        >
          Needs a reply
        </Chip>
        <Chip
          active={filter === "critical"}
          onClick={() => setFilter("critical")}
          count={stats.critical}
        >
          Critical
        </Chip>
      </ChipRail>

      {visible.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nothing in this view"
          description="Every review in this filter has been handled."
          compact
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((review) => (
            <li
              key={review.id}
              className="space-y-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  src={review.users?.avatar_url}
                  name={review.users?.full_name ?? review.users?.email}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {review.users?.full_name || review.users?.email || "Student"}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StarRating value={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "d MMM yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              {review.comment ? (
                <p className="text-sm text-foreground">{review.comment}</p>
              ) : null}

              {review.photos?.length ? (
                <div className="flex gap-2">
                  {review.photos.slice(0, 4).map((photo) => (
                    <span
                      key={photo}
                      className="relative h-16 w-16 overflow-hidden rounded-xl border border-border"
                    >
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </span>
                  ))}
                </div>
              ) : null}

              {review.owner_response ? (
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs font-semibold text-foreground">
                    Your reply
                    {review.owner_response_at ? (
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        {format(new Date(review.owner_response_at), "d MMM")}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.owner_response}
                  </p>
                </div>
              ) : respondingTo === review.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Thank them, or explain what you'll change…"
                    rows={3}
                    maxLength={500}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRespondingTo(null)
                        setResponse("")
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      loading={saving}
                      onClick={() => postResponse(review.id)}
                    >
                      Post reply
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRespondingTo(review.id)
                    setResponse("")
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Reply
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
