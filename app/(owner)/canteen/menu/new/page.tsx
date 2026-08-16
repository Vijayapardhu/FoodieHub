import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { NewItemForm } from "@/components/canteen-owner/new-item-form"

export const metadata = { title: "Add dish" }

export default async function NewItemPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!canteen) redirect("/canteen")

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  return (
    <>
      <ConsoleHeader
        title="Add a dish"
        description="It goes live on your menu as soon as you save"
      />

      <div className="mx-auto max-w-2xl pb-24 lg:max-w-6xl lg:pb-0">
        <NewItemForm canteenId={canteen.id} categories={categories ?? []} />
      </div>
    </>
  )
}
