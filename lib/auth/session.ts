import { cache } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database.types"

type UserRole = Database["public"]["Enums"]["user_role"]

/**
 * Per-request memoised session lookups.
 *
 * A single navigation used to authenticate several times over: the route
 * group's layout called requireRole, then the page called it again, and each
 * call meant a `getUser()` round trip to Supabase plus a `users` row read.
 * On a Tokyo-hosted project that is close to a second of dead time before any
 * query for the actual screen even starts.
 *
 * React's `cache` scopes each of these to one render pass, so a layout and its
 * page now share a single answer. It is not a cross-request cache: nothing is
 * held between users or between navigations, so a role change still takes
 * effect on the very next request.
 */
export const getSupabase = cache(async () => createClient())

export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getSessionRole = cache(async (userId: string): Promise<UserRole> => {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      // A failing RLS policy shouldn't lock somebody out of the customer app.
      console.error("[session] role lookup failed", error)
      return "user"
    }
    return (data?.role ?? "user") as UserRole
  } catch (error) {
    console.error("[session] role lookup threw", error)
    return "user"
  }
})
