import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { ReviewsList } from "@/components/canteen-owner/reviews-list"

export const metadata = { title: "Reviews" }

export default async function ReviewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!canteen) redirect("/canteen")

  // The order's dishes come along so the screen can show what a review was
  // actually about, and work out which dishes keep turning up in unhappy ones.
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "*, users(full_name, email, avatar_url), orders(order_items(items(name)))"
    )
    .eq("canteen_id", canteen.id)
    .order("created_at", { ascending: false })

  const withDishes = (reviews ?? []).map((review) => ({
    ...review,
    dishes: Array.from(
      new Set(
        (((review as any).orders?.order_items ?? []) as any[])
          .map((line) => line.items?.name)
          .filter(Boolean)
      )
    ) as string[],
  }))

  return (
    <>
      <ConsoleHeader
        title="Reviews"
        description="Replies are public — they are read by everyone who looks at your page"
      />

      <ReviewsList reviews={withDishes as any} canteenId={canteen.id} />
    </>
  )
}
