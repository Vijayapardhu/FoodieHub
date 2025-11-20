import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { notFound } from "next/navigation"
import { ReviewEditForm } from "@/components/profile/review-edit-form"
import { requireRole } from "@/lib/auth/require-role"

export default async function EditFeedbackPage({
  params,
}: {
  params: { id: string }
}) {
  const { supabase, user } = await requireRole([
    "student",
    "canteen_owner",
    "admin",
  ])

  const { data: feedback } = await supabase
    .from("reviews")
    .select("*, items(name), canteens(name)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!feedback) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 space-y-2">
          <p className="text-sm uppercase tracking-wide text-primary">
            Edit feedback
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            {feedback.items?.name || "Order"} ·{" "}
            {feedback.canteens?.name || "Canteen"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Update your rating or add more details. Changes reflect instantly.
          </p>
        </div>
        <div className="rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-sm">
          <ReviewEditForm
            reviewId={feedback.id}
            initialRating={feedback.rating}
            initialComment={feedback.comment}
          />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

