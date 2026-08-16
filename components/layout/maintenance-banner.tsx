import { Megaphone } from "lucide-react"
import { getPlatformSettings } from "@/lib/data/platform-settings"

/**
 * Site-wide notice, shown only while an admin has set a maintenance message.
 * Renders nothing otherwise, so it costs no vertical space in the common case.
 */
export async function MaintenanceBanner() {
  const settings = await getPlatformSettings()
  const message = settings.maintenance_message?.trim()

  if (!message && settings.ordering_enabled) return null

  return (
    <div
      role="status"
      className="border-b border-warning/30 bg-warning-soft px-4 py-2.5"
    >
      <p className="mx-auto flex max-w-3xl items-start gap-2 text-sm text-warning lg:max-w-5xl">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {message ||
            "Ordering is paused right now. You can still browse menus."}
        </span>
      </p>
    </div>
  )
}
