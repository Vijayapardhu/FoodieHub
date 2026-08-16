import Link from "next/link"
import { redirect } from "next/navigation"
import { QrCode } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { OrderManagement } from "@/components/canteen-owner/order-management"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ACTIVE_ORDER_STATUSES } from "@/lib/utils/order-status"
import { PushOptIn } from "@/components/notifications/push-opt-in"

export const metadata = { title: "Orders" }

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!canteen) redirect("/canteen")

  const select = "*, users(email, full_name)"

  const [{ data: activeOrders }, { data: pastOrders }] = await Promise.all([
    supabase
      .from("orders")
      .select(select)
      .eq("canteen_id", canteen.id)
      .in("status", ACTIVE_ORDER_STATUSES)
      .order("created_at", { ascending: true }),
    supabase
      .from("orders")
      .select(select)
      .eq("canteen_id", canteen.id)
      .in("status", ["completed", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  return (
    <>
      <ConsoleHeader
        title="Orders"
        description="Oldest first, so nobody waits longer than they should"
        actions={
          <Button asChild>
            <Link href="/canteen/orders/scan">
              <QrCode className="h-4 w-4" />
              Scan token
            </Link>
          </Button>
        }
      />

      {/* Right above the queue: the one screen an owner has open when they
          care about missing an order. */}
      <PushOptIn audience="owner" className="mb-4" />

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Queue ({activeOrders?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="past">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <OrderManagement orders={(activeOrders ?? []) as any} />
        </TabsContent>

        <TabsContent value="past">
          <OrderManagement orders={(pastOrders ?? []) as any} />
        </TabsContent>
      </Tabs>
    </>
  )
}
