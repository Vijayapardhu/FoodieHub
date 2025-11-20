import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { TokenTracking } from "@/components/orders/token-tracking"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth/require-role"

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { supabase, user } = await requireRole([
    "student",
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

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <TokenTracking order={order} />
      </div>
      <BottomNav />
    </div>
  )
}
