import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { UsersTable } from "@/components/admin/users-table"

export const metadata = { title: "Users" }

export default async function UsersPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500)

  return (
    <>
      <ConsoleHeader
        title="Users"
        description="Change a role and it applies on their next request"
      />

      <UsersTable users={users ?? []} />
    </>
  )
}
