import { AppShell } from "@/components/layout/app-shell"
import { ProfileFeedbackList } from "@/components/profile/profile-feedback-list"
import { requireRole } from "@/lib/auth/require-role"

export const metadata = { title: "Your reviews" }

export default async function ProfileFeedbackPage() {
  const { supabase, user } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const { data: feedbacks } = await supabase
    .from("reviews")
    .select("*, items(name), canteens(name)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  return (
    <AppShell title="Your reviews" showBack backHref="/profile">
      <ProfileFeedbackList feedbacks={(feedbacks ?? []) as any} />
    </AppShell>
  )
}
