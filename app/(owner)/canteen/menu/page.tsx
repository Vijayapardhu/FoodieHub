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
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent md:text-3xl">
            Menu Management
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage your menu items and categories
          </p>
        </div>
        <Link href="/canteen/menu/new" className="self-start">
          <Button className="w-full md:w-auto">
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

