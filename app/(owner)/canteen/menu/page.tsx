import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus } from "@/components/ui/icons"
import { createClient } from "@/lib/supabase/server"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { MenuManagement } from "@/components/canteen-owner/menu-management"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Menu" }

export default async function MenuManagementPage() {
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

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("items")
      .select("*, categories(name)")
      .eq("canteen_id", canteen.id)
      .order("name"),
  ])

  return (
    <>
      <ConsoleHeader
        title="Menu"
        description="Toggle availability instantly, or select several to update at once"
        actions={
          <Button asChild>
            <Link href="/canteen/menu/new">
              <Plus className="h-4 w-4" />
              Add dish
            </Link>
          </Button>
        }
      />

      <MenuManagement
        items={(items ?? []) as any}
        categories={categories ?? []}
        canteenId={canteen.id}
      />
    </>
  )
}
