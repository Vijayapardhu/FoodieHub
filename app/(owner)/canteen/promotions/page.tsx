import Link from "next/link"
import { Store } from "@/components/ui/icons"
import { requireRole } from "@/lib/auth/require-role"
import { getPlatformSettings } from "@/lib/data/platform-settings"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { PromoBannersList } from "@/components/canteen-owner/promo-banners-list"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { formatRupees } from "@/lib/utils/promo-banners"

export const metadata = { title: "Promote" }

export default async function OwnerPromotionsPage() {
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

  const [{ data: banners, error }, settings] = await Promise.all([
    supabase
      .from("promo_banners")
      .select("*, canteens(*), offers(id, title)")
      .eq("canteen_id", canteen.id)
      .order("created_at", { ascending: false }),
    getPlatformSettings(),
  ])

  if (error) console.error("[owner] promo banners", error)

  return (
    <>
      <ConsoleHeader
        title="Promote"
        description={`Home-screen banner slots · ${formatRupees(
          settings.promo_daily_rate
        )} a day`}
        actions={
          <Button asChild>
            <Link href="/canteen/promotions/new">Book a slot</Link>
          </Button>
        }
      />

      <PromoBannersList banners={(banners ?? []) as any} />
    </>
  )
}
