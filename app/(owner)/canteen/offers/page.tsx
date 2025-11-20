import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OffersList } from "@/components/canteen-owner/offers-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function OffersPage() {
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

  const { data: offers } = await supabase
    .from("offers")
    .select("*")
    .eq("canteen_id", canteen.id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Offers & Promotions</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage your promotional offers
          </p>
        </div>
        <Link href="/canteen/offers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Offer
          </Button>
        </Link>
      </div>

      <OffersList offers={offers || []} />
    </div>
  )
}

