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
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent md:text-3xl">
          Reviews
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          View and respond to customer reviews
        </p>
      </div>

      <ReviewsList reviews={reviews || []} canteenId={canteen.id} />
    </div>
  )
}

