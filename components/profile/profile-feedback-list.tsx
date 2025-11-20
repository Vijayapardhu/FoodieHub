import { Card } from "@/components/ui/card"
import Link from "next/link"
import { format } from "date-fns"
import { Database } from "@/types/database.types"
import { Button } from "@/components/ui/button"

type FeedbackSummary =
  Database["public"]["Tables"]["reviews"]["Row"] & {
    items: { name: string } | null
    canteens: { name: string } | null
  }

interface ProfileFeedbackListProps {
  feedbacks: FeedbackSummary[]
}

export function ProfileFeedbackList({ feedbacks }: ProfileFeedbackListProps) {
  if (feedbacks.length === 0) {
    return (
      <Card className="rounded-3xl border border-dashed border-orange-200 bg-white/80 p-6 text-center text-muted-foreground">
        No feedback yet. Once you start sharing reviews, they will appear here
        for quick edits.
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <Card
          key={feedback.id}
          className="rounded-3xl border border-orange-100 bg-white/90 p-4 shadow-sm"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">
                {feedback.items?.name || "Order"}
              </p>
              <p className="text-xs text-muted-foreground">
                {feedback.canteens?.name || "Canteen"} ·{" "}
                {format(new Date(feedback.created_at), "dd MMM, yyyy")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-primary">
              ⭐ {feedback.rating}
            </span>
          </div>
          {feedback.comment && (
            <p className="mt-3 text-sm text-muted-foreground">
              {feedback.comment}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/profile/feedback/${feedback.id}`}>Edit review</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link href={`/canteen/${feedback.canteen_id}`}>
                View canteen
              </Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

