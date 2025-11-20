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
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Edit Menu Item</h1>
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

