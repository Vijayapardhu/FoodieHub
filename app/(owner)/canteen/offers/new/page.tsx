import { requireRole } from "@/lib/auth/require-role"
import { Card, CardContent } from "@/components/ui/card"
import { NewOfferForm } from "@/components/canteen-owner/new-offer-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function NewOfferPage() {
  const { supabase, user } = await requireRole(["canteen_owner", "admin"])

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!canteen) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-muted-foreground">
              You need to set up a canteen before creating offers.
            </p>
            <Link href="/canteen">
              <Button className="rounded-full">Go to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-4 space-y-4 md:p-6 md:space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/canteen/offers">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent md:text-3xl">
            Create Offer
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Craft a promotion for users. Approval may be required.
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <NewOfferForm canteenId={canteen.id} />
        </CardContent>
      </Card>
    </div>
  )
}

