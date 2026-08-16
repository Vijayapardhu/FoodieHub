import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { ItemsModerationTable } from "@/components/admin/items-table"

export const metadata = { title: "Items" }

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
    <>
      <ConsoleHeader
        title="Featured items"
        description="Choose what gets promoted on the home carousel"
      />

      <ItemsModerationTable
        canteens={canteens ?? []}
        initialItems={(items ?? []) as any}
      />
    </>
  )
}
