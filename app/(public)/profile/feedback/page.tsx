import { Navbar } from "@/components/layout/navbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ProfileFeedbackList } from "@/components/profile/profile-feedback-list"
import { requireRole } from "@/lib/auth/require-role"

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            My Feedback
          </h1>
          <p className="text-sm text-muted-foreground">
            All reviews you&apos;ve shared with canteens. Tap any card to edit
            or refine your thoughts.
          </p>
        </div>
        <ProfileFeedbackList feedbacks={feedbacks ?? []} />
      </div>
      <BottomNav />
    </div>
  )
}

