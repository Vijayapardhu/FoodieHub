import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { CartPageContent } from "@/components/cart/cart-page-content"
import { requireRole } from "@/lib/auth/require-role"

export default async function CartPage({
  searchParams,
}: {
  searchParams: { canteen?: string }
}) {
  await requireRole(["student", "canteen_owner", "admin"])
  const canteenId = searchParams?.canteen ?? null

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Your Cart</h1>
        <p className="text-sm text-muted-foreground">
          Review your selections and adjust quantities before placing the order.
        </p>
        <CartPageContent canteenId={canteenId} />
      </div>
      <BottomNav />
    </div>
  )
}
