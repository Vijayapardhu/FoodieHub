import { notFound, redirect } from "next/navigation"
import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { EditItemForm } from "@/components/canteen-owner/edit-item-form"
import { lookupColumn } from "@/lib/utils/public-id"

export const metadata = { title: "Edit dish" }

export default async function EditMenuItemPage({
  params,
}: {
  params: { handle: string }
}) {
  const { supabase, user } = await requireRole(["canteen_owner", "admin"])

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id, owner_id")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!canteen) redirect("/canteen")

  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase
      .from("items")
      .select("*")
      .eq(lookupColumn(params.handle), params.handle)
      .eq("canteen_id", canteen.id)
      .maybeSingle(),
    supabase.from("categories").select("*").order("name"),
  ])

  if (!item) notFound()

  return (
    <>
      <ConsoleHeader title="Edit dish" description={item.name} />

      <div className="mx-auto max-w-2xl lg:max-w-6xl">
        <EditItemForm
          canteenId={canteen.id}
          item={item}
          categories={categories ?? []}
        />
      </div>
    </>
  )
}
