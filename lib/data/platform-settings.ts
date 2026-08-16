import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import {
  DEFAULT_PLATFORM_SETTINGS,
  type PlatformSettings,
} from "@/lib/utils/platform-settings"

/**
 * Platform settings for server components. Wrapped in React's `cache` so a
 * single render only queries once, no matter how many components ask.
 * Falls back to defaults when migration 019 hasn't been applied.
 */
export const getPlatformSettings = cache(
  async (): Promise<PlatformSettings> => {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", true)
        .maybeSingle()

      if (error || !data) return DEFAULT_PLATFORM_SETTINGS
      // Spread over the defaults so a column added by a migration that hasn't
      // been applied yet reads as its default rather than undefined.
      return { ...DEFAULT_PLATFORM_SETTINGS, ...data }
    } catch {
      return DEFAULT_PLATFORM_SETTINGS
    }
  }
)
