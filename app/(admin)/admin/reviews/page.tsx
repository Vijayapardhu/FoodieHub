import { ReviewsModeration } from "@/components/admin/reviews-moderation"
import { requireRole } from "@/lib/auth/require-role"

export default async function ReviewsPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, users(full_name, email), canteens(name), items(name)")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Review Moderation</h1>
        <p className="text-muted-foreground">
          Moderate and manage customer reviews
        </p>
      </div>

      <ReviewsModeration reviews={reviews || []} />
    </div>
  )
}

