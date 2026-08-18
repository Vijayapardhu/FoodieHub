import { Store } from "@/components/ui/icons"
import { requireRole } from "@/lib/auth/require-role"
import { getPlatformSettings } from "@/lib/data/platform-settings"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { PromoBannerForm } from "@/components/canteen-owner/promo-banner-form"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata = { title: "Book a banner" }

export default async function NewPromoBannerPage() {
  const { supabase, user } = await requireRole(["canteen_owner", "admin"])

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!canteen) {
    return (
      <EmptyState
        icon={Store}
        title="Register your canteen first"
        description="A banner advertises a canteen, so set yours up before booking one."
        action={{ label: "Register a canteen", href: "/canteen/register" }}
      />
    )
  }

  // Only discounts a student could actually use are worth advertising.
  const [{ data: offers }, settings] = await Promise.all([
    supabase
      .from("offers")
      .select("id, title, discount_type, discount_value, valid_until")
      .eq("canteen_id", canteen.id)
      .eq("is_approved", true)
      .eq("is_active", true)
      .gte("valid_until", new Date().toISOString())
      .order("valid_until", { ascending: true }),
    getPlatformSettings(),
  ])

  return (
    <>
      <ConsoleHeader
        title="Book a banner"
        description="Runs in the carousel at the top of the student home screen"
      />

      <div className="mx-auto max-w-2xl">
        <PromoBannerForm
          canteenId={canteen.id}
          canteenName={canteen.name}
          offers={(offers ?? []) as any}
          dailyRate={Number(settings.promo_daily_rate)}
        />
      </div>
    </>
  )
}
