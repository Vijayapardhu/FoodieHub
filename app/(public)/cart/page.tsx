import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { CartPageContent } from "@/components/cart/cart-page-content"
import { requireRole } from "@/lib/auth/require-role"

export default async function CartPage({
  searchParams,
}: {
  searchParams: { canteen?: string }
}) {
  await requireRole(["user", "canteen_owner", "admin"])
  const canteenId = searchParams?.canteen ?? null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 pb-20">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            Your Cart
          </h1>
          <p className="text-sm text-muted-foreground">
            Review your selections and adjust quantities before placing the order.
          </p>
        </div>
        <CartPageContent canteenId={canteenId} />
      </div>
      <BottomNav />
    </div>
  )
}
