import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { Database } from "@/types/database.types"
import { requireRole } from "@/lib/auth/require-role"

export default async function ProfileSettingsPage() {
  const { supabase, user } = await requireRole([
    "student",
    "canteen_owner",
    "admin",
  ])

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  const resolvedProfile: Database["public"]["Tables"]["users"]["Row"] =
    profile ?? {
      id: user.id,
      email: user.email ?? "",
      full_name: null,
      avatar_url: null,
      phone_number: null,
      role: "student",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 space-y-3">
          <p className="text-sm uppercase tracking-wide text-primary">
            Settings
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            Profile Settings
          </h1>
          <div className="rounded-3xl bg-gradient-to-r from-primary via-[#FF8A3C] to-[#FFB347] p-4 text-white shadow-lg">
            <p className="text-sm text-white/80">
              Signed in as {user.email ?? "unknown"}
            </p>
            <p className="text-lg font-semibold">
              {resolvedProfile.full_name ?? "Foodie member"}
            </p>
          </div>
        </div>
        <ProfileSettings user={user} profile={resolvedProfile} />
      </div>
      <BottomNav />
    </div>
  )
}

