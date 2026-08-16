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

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, rating, comment, photos")
    .eq("order_id", order.id)
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <AppShell
      title={existingReview ? "Edit review" : "Rate order"}
      showBack
      backHref={`/orders/${params.token}`}
      bottomPad="action-bar"
    >
      <FeedbackForm order={order as any} existingReview={existingReview} />
    </AppShell>
  )
}
