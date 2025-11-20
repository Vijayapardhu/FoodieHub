import { requireRole } from "@/lib/auth/require-role"
import { ItemsModerationTable } from "@/components/admin/items-table"

export default async function AdminItemsPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: canteens } = await supabase
    .from("canteens")
    .select("id, name")
    .order("name")

  const firstCanteenId = canteens?.[0]?.id

  const { data: items } = firstCanteenId
    ? await supabase
        .from("items")
        .select("*, canteens(name)")
        .eq("canteen_id", firstCanteenId)
        .order("updated_at", { ascending: false })
    : { data: [] }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Canteen Items</h1>
          <p className="text-sm text-muted-foreground">
            Review menu items, feature them on the home page, and manage carousel
            images.
          </p>
        </div>
      </div>
      <ItemsModerationTable
        canteens={canteens ?? []}
        initialItems={items ?? []}
      />
    </div>
  )
}

