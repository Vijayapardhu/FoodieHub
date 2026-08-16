import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { CategoriesTable } from "@/components/admin/categories-table"

export const metadata = { title: "Categories" }

export default async function CategoriesPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  return (
    <>
      <ConsoleHeader
        title="Categories"
        description="Shared across every canteen's menu"
      />

      <CategoriesTable categories={categories ?? []} />
    </>
  )
}
