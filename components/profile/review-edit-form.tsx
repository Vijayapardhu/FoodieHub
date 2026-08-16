"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarPicker } from "@/components/ui/star-rating"
import { StickyBar } from "@/components/ui/sticky-bar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const router = useRouter()
  const [rating, setRating] = useState(initialRating)
  const [comment, setComment] = useState(initialComment || "")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (rating < 1 || rating > 5) {
      toast.error("Pick a rating between 1 and 5")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("reviews")
        .update({
          rating,
          comment: comment.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId)

      if (error) throw error

      toast.success("Review updated")
      router.push("/profile/feedback")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update your review")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId)

      if (error) throw error

      toast.success("Review deleted")
      router.push("/profile/feedback")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not delete your review")
      setDeleting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4 text-center">
          <h2 className="text-sm font-semibold text-foreground">Your rating</h2>
          <div className="flex justify-center">
            <StarPicker value={rating} onChange={setRating} />
          </div>
        </section>

        <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <label
            htmlFor="review-body"
            className="text-sm font-semibold text-foreground"
          >
            Your review
          </label>
          <Textarea
            id="review-body"
            rows={6}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details that would help another student"
            maxLength={1000}
          />
          <p className="text-right text-xs text-muted-foreground tabular-nums">
            {comment.length}/1000
          </p>
        </section>

        <Button
          type="button"
          variant="outline"
          block
          onClick={() => setConfirmOpen(true)}
          className="border-destructive/40 text-destructive hover:bg-destructive-soft"
        >
          <Trash2 className="h-4 w-4" />
          Delete review
        </Button>

        <StickyBar>
          <Button type="submit" size="lg" block loading={saving}>
            Save changes
          </Button>
        </StickyBar>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this review?</DialogTitle>
            <DialogDescription>
              It will be removed from the canteen&apos;s page and its rating
              recalculated. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              block
              loading={deleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
