import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MenuManagement } from "@/components/canteen-owner/menu-management"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function MenuManagementPage() {
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

  const { data: items } = await supabase
    .from("items")
    .select("*, categories(name)")
    .eq("canteen_id", canteen.id)
    .order("name")

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            Manage your menu items and categories
          </p>
        </div>
        <Link href="/canteen/menu/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      <MenuManagement
        items={items || []}
        categories={categories || []}
        canteenId={canteen.id}
      />
    </div>
  )
}

