import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ChevronRight, MessageSquare } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { StarRating } from "@/components/ui/star-rating"
import { EmptyState } from "@/components/ui/empty-state"
import { reviewPath } from "@/lib/utils/public-id"

type FeedbackSummary = Database["public"]["Tables"]["reviews"]["Row"] & {
  items: { name: string } | null
  canteens: { name: string } | null
}

export function ProfileFeedbackList({
  feedbacks,
}: {
  feedbacks: FeedbackSummary[]
}) {
  if (feedbacks.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No reviews yet"
        description="Rate a completed order and it'll show up here, ready to edit."
        action={{ label: "See your orders", href: "/orders" }}
      />
    )
  }

  return (
    <ul className="space-y-3">
      {feedbacks.map((feedback) => (
        <li key={feedback.id}>
          <Link
            href={reviewPath(feedback)}
            className="block rounded-2xl border border-border bg-card p-4 transition-transform active:scale-[0.99]"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {feedback.items?.name ||
                    feedback.canteens?.name ||
                    "Order review"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {feedback.canteens?.name || "Canteen"} ·{" "}
                  {format(new Date(feedback.created_at), "d MMM yyyy")}
                </p>
                <StarRating value={feedback.rating} className="mt-1.5" />
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>

            {feedback.comment ? (
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {feedback.comment}
              </p>
            ) : null}

            {feedback.photos?.length ? (
              <div className="mt-3 flex gap-2">
                {feedback.photos.slice(0, 4).map((photo) => (
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

            {feedback.owner_response ? (
              <div className="mt-3 rounded-xl bg-muted p-3">
                <p className="text-xs font-semibold text-foreground">
                  Canteen replied
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {feedback.owner_response}
                </p>
              </div>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
