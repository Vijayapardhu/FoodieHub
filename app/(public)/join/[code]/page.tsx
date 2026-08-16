import { Users } from "@/components/ui/icons"
import { AppShell } from "@/components/layout/app-shell"
import { EmptyState } from "@/components/ui/empty-state"
import { GroupOrderJoin } from "@/components/cart/group-order-join"
import { requireRole } from "@/lib/auth/require-role"

export const metadata = { title: "Join an order" }

export default async function JoinGroupOrderPage({
  params,
}: {
  params: { code: string }
}) {
  const { supabase } = await requireRole(["user", "canteen_owner", "admin"])

  const { data } = await supabase.rpc("find_group_order", {
    code: params.code,
  })

  const group = (data as any[])?.[0]

  if (!group) {
    return (
      <AppShell title="Join an order" showBack backHref="/home">
        <EmptyState
          icon={Users}
          title="That order isn't open"
          description="Either the code is wrong, or the kitchen has already started cooking — once an order is accepted it can't be added to."
          action={{ label: "Order your own", href: "/home" }}
        />
      </AppShell>
    )
  }

  return (
    <AppShell title="Join an order" showBack backHref="/home">
      <GroupOrderJoin
        orderId={group.order_id}
        canteenId={group.canteen_id}
        canteenName={group.canteen_name}
        canteenSlug={group.canteen_slug}
        hostName={group.host_name}
        itemCount={Number(group.item_count)}
        code={params.code.toUpperCase()}
      />
    </AppShell>
  )
}
