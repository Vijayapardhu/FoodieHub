import { UsersTable } from "@/components/admin/users-table"
import { requireRole } from "@/lib/auth/require-role"

export default async function UsersPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage all platform users</p>
      </div>

      <UsersTable users={users || []} />
    </div>
  )
}

