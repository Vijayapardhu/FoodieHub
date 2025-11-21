import { CategoriesTable } from "@/components/admin/categories-table"
import { requireRole } from "@/lib/auth/require-role"

export default async function CategoriesPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          Categories
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage the meal categories available on the platform.
        </p>
      </div>
      <CategoriesTable categories={categories ?? []} />
    </div>
  )
}

