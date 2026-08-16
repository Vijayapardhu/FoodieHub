import { redirect } from "next/navigation"
import { Database } from "@/types/database.types"
import { getSessionRole, getSessionUser, getSupabase } from "@/lib/auth/session"

type UserRole = Database["public"]["Enums"]["user_role"]

const roleRedirect: Record<UserRole, string> = {
  user: "/home",
  canteen_owner: "/canteen",
  admin: "/admin",
}

/**
 * Gate a server component on a role, and hand back the client, user and role
 * it already had to look up.
 *
 * Every lookup inside is memoised per request, so the layout and the page it
 * wraps can both call this without paying for it twice.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getSessionUser()

  if (!user) {
    redirect("/login")
  }

  const role = await getSessionRole(user.id)

  if (!allowedRoles.includes(role)) {
    redirect(roleRedirect[role] ?? "/home")
  }

  const supabase = await getSupabase()
  return { supabase, user, role }
}
