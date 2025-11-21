import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { OrderDetailView } from "@/components/canteen-owner/order-detail-view"

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!canteen) {
    redirect("/canteen")
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*, users(*), order_items(*, items(*))")
    .eq("id", params.id)
    .eq("canteen_id", canteen.id)
    .single()

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-4 md:p-6">
      <OrderDetailView order={order} />
    </div>
  )
}

