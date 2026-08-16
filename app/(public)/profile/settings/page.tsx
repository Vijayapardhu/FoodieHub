import { AppShell } from "@/components/layout/app-shell"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { Database } from "@/types/database.types"
import { requireRole } from "@/lib/auth/require-role"

export const metadata = { title: "Settings" }

export default async function ProfileSettingsPage() {
  const { supabase, user, role } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  const resolvedProfile: Database["public"]["Tables"]["users"]["Row"] =
    profile ?? {
      id: user.id,
      email: user.email ?? "",
      full_name: null,
      avatar_url: null,
      phone_number: null,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

  return (
    <AppShell
      title="Settings"
      showBack
      backHref="/profile"
      bottomPad="action-bar"
    >
      <ProfileSettings user={user} profile={resolvedProfile} />
    </AppShell>
  )
}
