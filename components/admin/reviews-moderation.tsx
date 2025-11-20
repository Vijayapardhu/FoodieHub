"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import { Star, Trash2 } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  users: { full_name: string | null; email: string } | null
  canteens: { name: string } | null
  items: { name: string } | null
}

interface ReviewsModerationProps {
  reviews: Review[]
}

export function ReviewsModeration({ reviews: initialReviews }: ReviewsModerationProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const supabase = createClient()

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId)

      if (error) throw error

      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
      toast.success("Review deleted")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete review")
    }
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">
                    {review.users?.full_name || review.users?.email || "Anonymous"}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.canteens?.name || review.items?.name || "Unknown"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "PPpp")}
                  </p>
                </div>
                <Button
                  onClick={() => deleteReview(review.id)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>

              {review.comment && (
                <p className="text-sm">{review.comment}</p>
              )}

              {review.owner_response && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-semibold">Owner Response:</p>
                  <p className="mt-1 text-sm">{review.owner_response}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

