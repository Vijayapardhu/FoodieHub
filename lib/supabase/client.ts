import { createBrowserClient } from "@supabase/ssr"
import { Database } from "@/types/database.types"

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>

let client: BrowserClient | undefined

/**
 * Browser Supabase client. Cached module-wide so every component shares one
 * instance — a fresh client per render would tear down and re-open realtime
 * channels on each pass.
 */
export function createClient(): BrowserClient {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
