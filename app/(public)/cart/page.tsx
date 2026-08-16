import { AppShell } from "@/components/layout/app-shell"
import { CartPageContent } from "@/components/cart/cart-page-content"
import { requireRole } from "@/lib/auth/require-role"
import { lookupColumn } from "@/lib/utils/public-id"
import { PromoSlot } from "@/components/promo/promo-slot"

export const metadata = { title: "Cart" }

export default async function CartPage({
  searchParams,
}: {
  searchParams: { canteen?: string }
}) {
  const { supabase } = await requireRole(["user", "canteen_owner", "admin"])

  // The cart itself is keyed by canteen id in local storage, but the URL
  // carries the slug, so resolve one to the other here.
  const handle = searchParams?.canteen ?? null
  let canteenId: string | null = null

  if (handle) {
    const { data: canteen } = await supabase
      .from("canteens")
      .select("id")
      .eq(lookupColumn(handle), handle)
      .maybeSingle()
    canteenId = canteen?.id ?? null
  }

  return (
    <AppShell title="Your cart" showBack bottomPad="action-bar">
      <CartPageContent
        canteenId={canteenId}
        promo={<PromoSlot placement="cart" />}
      />
    </AppShell>
  )
}
