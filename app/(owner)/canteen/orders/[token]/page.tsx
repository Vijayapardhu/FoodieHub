import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { OrderDetailView } from "@/components/canteen-owner/order-detail-view"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "@/components/ui/icons"
import { isUuid } from "@/lib/utils/public-id"

export const metadata = { title: "Order" }

export default async function OrderDetailPage({
  params,
}: {
  params: { token: string }
}) {
  const handle = decodeURIComponent(params.token)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: canteen } = await supabase
    .from("canteens")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!canteen) redirect("/canteen")

  const { data: order } = await supabase
    .from("orders")
    .select("*, users(*), delivery_blocks(name), order_items(*, items(*))")
    .eq(
      isUuid(handle) ? "id" : "token",
      isUuid(handle) ? handle : handle.toUpperCase()
    )
    .eq("canteen_id", canteen.id)
    .maybeSingle()

  if (!order) notFound()

  return (
    <>
      <ConsoleHeader
        title={`Order #${order.token}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/canteen/orders">
              <ArrowLeft className="h-4 w-4" />
              Queue
            </Link>
          </Button>
        }
      />

      <div className="pb-24 md:pb-0">
        <OrderDetailView order={{ ...order, canteens: canteen } as any} />
      </div>
    </>
  )
}
