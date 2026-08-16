import { Store } from "@/components/ui/icons"
import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { NewOfferForm } from "@/components/canteen-owner/new-offer-form"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata = { title: "New offer" }

export default async function NewOfferPage() {
  const { supabase, user } = await requireRole(["canteen_owner", "admin"])

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!canteen) {
    return (
      <EmptyState
        icon={Store}
        title="Register your canteen first"
        description="Offers attach to a canteen, so set yours up before creating one."
        action={{ label: "Register a canteen", href: "/canteen/register" }}
      />
    )
  }

  return (
    <>
      <ConsoleHeader
        title="Create an offer"
        description="An admin reviews it before students can use it"
      />

      <div className="mx-auto max-w-2xl pb-24 lg:pb-0">
        <NewOfferForm canteenId={canteen.id} />
      </div>
    </>
  )
}
