import type { createBrowserClient } from "@supabase/ssr"
import { Database } from "@/types/database.types"

/**
 * The browser and server clients are structurally the same for our purposes;
 * naming one of them keeps the query results typed on both call paths.
 */
type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>

/**
 * Where a signed-in account belongs.
 *
 * Shared by the login form, the OAuth callback and the middleware so all three
 * agree. Sending everyone to `/` and letting middleware bounce them costs an
 * extra request, an extra redirect and two extra queries on the slowest moment
 * in the whole product — the wait right after you tap Sign in.
 */
export async function resolveDestination(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from("users")
    .select("role, phone_number")
    .eq("id", userId)
    .maybeSingle()

  if (!profile) return "/home"

  if (profile.role === "admin") return "/admin"

  if (profile.role === "canteen_owner") {
    const { data: canteen } = await supabase
      .from("canteens")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle()
    return canteen ? "/canteen" : "/canteen/register"
  }

  // A phone number is what lets a canteen reach someone about a live order,
  // so it's collected once before the first visit to the menu.
  if (!profile.phone_number) return "/complete-profile"

  return "/home"
}
