import { PromotionsManagement } from "@/components/admin/promotions-management"
import { requireRole } from "@/lib/auth/require-role"

export default async function PromotionsPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: pendingPromotions } = await supabase
    .from("offers")
    .select("*, canteens(name)")
    .eq("is_approved", false)
    .order("created_at", { ascending: false })

  const { data: approvedPromotions } = await supabase
    .from("offers")
    .select("*, canteens(name)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Promotion Management</h1>
        <p className="text-muted-foreground">
          Review and approve promotional offers
        </p>
      </div>

      <PromotionsManagement
        pendingPromotions={pendingPromotions || []}
        approvedPromotions={approvedPromotions || []}
      />
    </div>
  )
}

