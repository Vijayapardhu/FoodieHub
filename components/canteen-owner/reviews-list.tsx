"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import { Star } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  users: { full_name: string | null; email: string } | null
}

interface ReviewsListProps {
  reviews: Review[]
  canteenId: string
}

export function ReviewsList({ reviews, canteenId }: ReviewsListProps) {
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleResponse = async (reviewId: string) => {
    if (!response.trim()) {
      toast.error("Please enter a response")
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from("reviews")
        .update({
          owner_response: response,
          owner_response_at: new Date().toISOString(),
        })
        .eq("id", reviewId)

      if (error) throw error

      toast.success("Response posted")
      setRespondingTo(null)
      setResponse("")
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to post response")
    } finally {
      setLoading(false)
    }
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No reviews yet</p>
        </CardContent>
      </Card>
    )
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
                    {format(new Date(review.created_at), "PPpp")}
                  </p>
                </div>
              </div>

              {review.comment && (
                <p className="text-sm">{review.comment}</p>
              )}

              {review.owner_response ? (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-semibold">Your Response:</p>
                  <p className="mt-1 text-sm">{review.owner_response}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {format(new Date(review.owner_response_at!), "PPpp")}
                  </p>
                </div>
              ) : (
                <div>
                  {respondingTo === review.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Write your response..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleResponse(review.id)}
                          disabled={loading}
                          size="sm"
                        >
                          Post Response
                        </Button>
                        <Button
                          onClick={() => {
                            setRespondingTo(null)
                            setResponse("")
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setRespondingTo(review.id)}
                      variant="outline"
                      size="sm"
                    >
                      Respond
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

