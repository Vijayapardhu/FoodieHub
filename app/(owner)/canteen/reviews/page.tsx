import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReviewsList } from "@/components/canteen-owner/reviews-list"

export default async function ReviewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!canteen) {
    redirect("/canteen")
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, users(full_name, email)")
    .eq("canteen_id", canteen.id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">
          View and respond to customer reviews
        </p>
      </div>

      <ReviewsList reviews={reviews || []} canteenId={canteen.id} />
    </div>
  )
}

