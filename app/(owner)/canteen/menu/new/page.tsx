import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NewItemForm } from "@/components/canteen-owner/new-item-form"

export default async function NewItemPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!canteen) {
    redirect("/canteen")
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Item</h1>
        <p className="text-muted-foreground">Create a new menu item</p>
      </div>

      <NewItemForm canteenId={canteen.id} categories={categories || []} />
    </div>
  )
}

