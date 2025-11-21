import { CanteensTable } from "@/components/admin/canteens-table"
import { requireRole } from "@/lib/auth/require-role"

export default async function CanteensPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: canteens } = await supabase
    .from("canteens")
    .select("*, users(email, full_name)")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          Canteen Management
        </h1>
        <p className="text-muted-foreground">Manage all canteens on the platform</p>
      </div>

      <CanteensTable canteens={canteens || []} />
    </div>
  )
}

