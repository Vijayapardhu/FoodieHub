import { AppShell } from "@/components/layout/app-shell"
import { OrderConfirmation } from "@/components/cart/order-confirmation"
import { requireRole } from "@/lib/auth/require-role"

export const metadata = { title: "Confirm order" }

export default async function ConfirmOrderPage() {
  await requireRole(["user", "canteen_owner", "admin"])

  return (
    <AppShell title="Confirm order" showBack backHref="/cart" bottomPad="action-bar">
      <OrderConfirmation />
    </AppShell>
  )
}
