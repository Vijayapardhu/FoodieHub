import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Database } from "@/types/database.types"

type UserRole = Database["public"]["Enums"]["user_role"]

const roleRedirect: Record<UserRole, string> = {
  user: "/home",
  canteen_owner: "/canteen",
  admin: "/admin",
}

export async function requireRole(allowedRoles: UserRole[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Try to get user profile, but handle errors gracefully
  let role: UserRole = "user"
  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (error) {
      console.error("[requireRole] Error fetching user profile:", error)
      // If RLS policy fails, default to user role and continue
      role = "user"
    } else {
      role = (profile?.role ?? "user") as UserRole
    }
  } catch (error) {
    console.error("[requireRole] Exception fetching user profile:", error)
    // Default to user role on any error
    role = "user"
  }

  if (!allowedRoles.includes(role)) {
    redirect(roleRedirect[role] ?? "/home")
  }

  return { supabase, user, role }
}

