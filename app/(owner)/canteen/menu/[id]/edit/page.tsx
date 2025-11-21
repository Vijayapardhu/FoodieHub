import { requireRole } from "@/lib/auth/require-role"
import { notFound, redirect } from "next/navigation"
import { EditItemForm } from "@/components/canteen-owner/edit-item-form"

export default async function EditMenuItemPage({
  params,
}: {
  params: { id: string }
}) {
  const { supabase, user } = await requireRole(["canteen_owner", "admin"])

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id, owner_id")
    .eq("owner_id", user.id)
    .single()

  if (!canteen) {
    redirect("/canteen")
  }

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", params.id)
    .eq("canteen_id", canteen.id)
    .single()

  if (!item) {
    notFound()
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-4 space-y-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent md:text-3xl">
          Edit Menu Item
        </h1>
        <p className="text-sm text-muted-foreground">
          Update details for {item.name}
        </p>
      </div>
      <EditItemForm
        canteenId={canteen.id}
        item={item}
        categories={categories ?? []}
      />
    </div>
  )
}

