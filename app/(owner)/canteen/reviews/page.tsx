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

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, users(full_name, email, avatar_url)")
    .eq("canteen_id", canteen.id)
    .order("created_at", { ascending: false })

  return (
    <>
      <ConsoleHeader
        title="Reviews"
        description="Replying publicly shows students you're listening"
      />

      <ReviewsList reviews={(reviews ?? []) as any} canteenId={canteen.id} />
    </>
  )
}
