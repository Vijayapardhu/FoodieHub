import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { DeliveryBlocksTable } from "@/components/admin/delivery-blocks-table"

export const metadata = { title: "Delivery blocks" }

export default async function AdminDeliveryPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: blocks } = await supabase
    .from("delivery_blocks")
    .select("*")
    .order("sort_order")
    .order("name")

  return (
    <>
      <ConsoleHeader
        title="Delivery blocks"
        description="The fixed drop-off points a student can choose at checkout. Turn delivery on for the platform under Settings once you have at least one."
      />

      <DeliveryBlocksTable blocks={blocks ?? []} />
    </>
  )
}
