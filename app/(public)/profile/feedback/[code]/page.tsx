import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { ReviewEditForm } from "@/components/profile/review-edit-form"
import { requireRole } from "@/lib/auth/require-role"
import { lookupColumn } from "@/lib/utils/public-id"

export const metadata = { title: "Edit review" }

export default async function EditFeedbackPage({
  params,
}: {
  params: { code: string }
}) {
  const { supabase, user } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const { data: feedback } = await supabase
    .from("reviews")
    .select("*, items(name), canteens(name)")
    .eq(lookupColumn(params.code, "public_code"), params.code)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!feedback) {
    notFound()
  }

  return (
    <AppShell
      title="Edit review"
      showBack
      backHref="/profile/feedback"
      bottomPad="action-bar"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">
            {feedback.items?.name || feedback.canteens?.name || "Order"}
          </p>
          <p className="text-xs text-muted-foreground">
            {feedback.canteens?.name || "Canteen"}
          </p>
        </div>

        <ReviewEditForm
          reviewId={feedback.id}
          initialRating={feedback.rating}
          initialComment={feedback.comment}
        />
      </div>
    </AppShell>
  )
}
