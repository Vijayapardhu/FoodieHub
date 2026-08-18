import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Bypasses RLS. Only for server code that has already established, by some
 * other means, that the write is legitimate — a webhook whose signature was
 * verified, or an API route that checked the order belongs to the caller.
 * Never import this into anything that runs in the browser.
 *
 * Deliberately untyped (no `Database` generic): the version of
 * @supabase/supabase-js this project resolves to needs every table in the
 * hand-maintained Database type to carry a `Relationships` field to type
 * generic queries strictly, and this type predates that convention. Adding
 * it is a real fix, but a repo-wide one — out of scope here. This client's
 * surface is tiny (a couple of columns on `orders`), so the loss of
 * inference is a fair trade against destabilizing every other file that
 * types its Supabase queries off this same interface.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
