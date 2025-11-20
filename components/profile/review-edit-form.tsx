"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast"

interface ReviewEditFormProps {
  reviewId: string
  initialRating: number
  initialComment: string | null
}

export function ReviewEditForm({
  reviewId,
  initialRating,
  initialComment,
}: ReviewEditFormProps) {
  const [rating, setRating] = useState(initialRating)
  const [comment, setComment] = useState(initialComment || "")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      toast.error("Rating must be between 1 and 5")
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase
        .from("reviews")
        .update({
          rating,
          comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId)

      if (error) throw error

      toast.success("Review updated")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Rating (1-5)</label>
        <Input
          type="number"
          min={1}
          max={5}
          step={1}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 w-24"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Your feedback</label>
        <Textarea
          rows={5}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share details that will help others"
          className="mt-1"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-primary"
      >
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}

