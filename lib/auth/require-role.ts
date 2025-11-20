import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Database } from "@/types/database.types"

type UserRole = Database["public"]["Enums"]["user_role"]

const roleRedirect: Record<UserRole, string> = {
  student: "/home",
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

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = (profile?.role ?? "student") as UserRole

  if (!allowedRoles.includes(role)) {
    redirect(roleRedirect[role] ?? "/home")
  }

  return { supabase, user, role }
}

