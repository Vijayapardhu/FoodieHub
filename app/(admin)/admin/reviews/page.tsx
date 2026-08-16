import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { ReviewsModeration } from "@/components/admin/reviews-moderation"

export const metadata = { title: "Reviews" }

export default async function ReviewsPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, users(full_name, email), canteens(name), items(name)")
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <>
      <ConsoleHeader
        title="Reviews"
        description="Remove abuse and spam — leave honest criticism in place"
      />

      <ReviewsModeration reviews={(reviews ?? []) as any} />
    </>
  )
}
