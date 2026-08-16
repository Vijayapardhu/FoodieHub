import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus } from "@/components/ui/icons"
import { createClient } from "@/lib/supabase/server"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { OffersList } from "@/components/canteen-owner/offers-list"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Offers" }

export default async function OffersPage() {
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

  const { data: offers } = await supabase
    .from("offers")
    .select("*")
    .eq("canteen_id", canteen.id)
    .order("created_at", { ascending: false })

  return (
    <>
      <ConsoleHeader
        title="Offers"
        description="Discounts run once an admin approves them"
        actions={
          <Button asChild>
            <Link href="/canteen/offers/new">
              <Plus className="h-4 w-4" />
              New offer
            </Link>
          </Button>
        }
      />

      <OffersList offers={offers ?? []} />
    </>
  )
}
