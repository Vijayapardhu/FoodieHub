import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { TokenTracking } from "@/components/orders/token-tracking"
import { requireRole } from "@/lib/auth/require-role"
import { isUuid } from "@/lib/utils/public-id"

export const metadata = { title: "Track order" }

export default async function OrderDetailPage({
  params,
}: {
  params: { token: string }
}) {
  const { supabase, user } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  // Orders are addressed by the pickup token that's printed on the bill — the
  // identifier the student already has in their hand. Old uuid links still
  // resolve. Either way the row is scoped to the signed-in user, so guessing
  // a token gets you nothing.
  const handle = decodeURIComponent(params.token)

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
        *,
        canteens:canteens(*),
        order_items(
          *,
          items(*)
        ),
        users:users(
          full_name,
          email
        )
      `
    )
    .eq(isUuid(handle) ? "id" : "token", isUuid(handle) ? handle : handle.toUpperCase())
    .eq("user_id", user.id)
    .maybeSingle()

  if (!order) {
    notFound()
  }

  return (
    <AppShell title="Track order" showBack backHref="/orders">
      <TokenTracking order={order as any} />
    </AppShell>
  )
}
