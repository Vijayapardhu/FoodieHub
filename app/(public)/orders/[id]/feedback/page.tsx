import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { FeedbackForm } from "@/components/orders/feedback-form"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth/require-role"

export default async function FeedbackPage({
  params,
}: {
  params: { id: string }
}) {
  const { supabase, user } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const orderSelect = `
    *,
    canteens:canteens!inner(
      id,
      name,
      contact_phone,
      address,
      address_reference,
      google_maps_url
    ),
    order_items(
      *,
      items(*)
    )
  `

  const { data: order } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!order) {
    notFound()
  }

  // Check if feedback already exists
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, rating, comment, photos")
    .eq("order_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <FeedbackForm order={order} existingReview={existingReview} />
      </div>
      <BottomNav />
    </div>
  )
}

