import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OrderManagement } from "@/components/canteen-owner/order-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function OrdersPage() {
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

  const { data: activeOrders } = await supabase
    .from("orders")
    .select("*, users(email, full_name)")
    .eq("canteen_id", canteen.id)
    .in("status", ["pending", "confirmed", "preparing", "ready"])
    .order("created_at", { ascending: false })

  const { data: completedOrders } = await supabase
    .from("orders")
    .select("*, users(email, full_name)")
    .eq("canteen_id", canteen.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent md:text-3xl">
            Order Management
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage and track all orders for your canteen
          </p>
        </div>
        <Link
          href="/canteen"
          className="inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-white px-3 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary/5 hover:shadow-sm md:px-4 md:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to dashboard</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full justify-start overflow-auto rounded-full bg-orange-50/70 p-1 text-sm md:w-auto">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          <OrderManagement orders={activeOrders || []} />
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <OrderManagement orders={completedOrders || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

