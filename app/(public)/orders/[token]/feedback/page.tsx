import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { FeedbackForm } from "@/components/orders/feedback-form"
import { requireRole } from "@/lib/auth/require-role"
import { isUuid } from "@/lib/utils/public-id"

export const metadata = { title: "Rate order" }

export default async function FeedbackPage({
  params,
}: {
  params: { token: string }
}) {
  const { supabase, user } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const handle = decodeURIComponent(params.token)

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
        *,
        canteens:canteens(*),
        order_items(*, items(*))
      `
    )
    .eq(isUuid(handle) ? "id" : "token", isUuid(handle) ? handle : handle.toUpperCase())
    .eq("user_id", user.id)
    .maybeSingle()

  if (!order) {
    notFound()
  }

  // Every review this student left for this order, in one read. It cannot be
  // maybeSingle() any more: an order now carries one review of the canteen
  // plus one per dish rated, and maybeSingle throws the moment there are two.
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, photos, item_id")
    .eq("order_id", order.id)
    .eq("user_id", user.id)

  const existingReview =
    (reviews ?? []).find((review) => review.item_id === null) ?? null

  const existingItemReviews = (reviews ?? [])
    .filter((review) => review.item_id !== null)
    .map((review) => ({
      id: review.id,
      itemId: review.item_id as string,
      rating: review.rating,
    }))

  return (
    <AppShell
      title={existingReview ? "Edit review" : "Rate order"}
      showBack
      backHref={`/orders/${params.token}`}
      bottomPad="action-bar"
    >
      <FeedbackForm
        order={order as any}
        existingReview={existingReview}
        existingItemReviews={existingItemReviews}
      />
    </AppShell>
  )
}
