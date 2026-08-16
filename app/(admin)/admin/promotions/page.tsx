import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { PromotionsManagement } from "@/components/admin/promotions-management"
import { PromoBannerManagement } from "@/components/admin/promo-banner-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPlatformSettings } from "@/lib/data/platform-settings"
import { formatRupees } from "@/lib/utils/promo-banners"

export const metadata = { title: "Promotions" }

export default async function PromotionsPage() {
  const { supabase } = await requireRole(["admin"])

  const [
    { data: pendingPromotions },
    { data: approvedPromotions },
    { data: banners, error: bannersError },
    settings,
  ] = await Promise.all([
    supabase
      .from("offers")
      .select("*, canteens(name)")
      .eq("is_approved", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select("*, canteens(name)")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("promo_banners")
      .select("*, canteens(*), offers(id, title)")
      .order("created_at", { ascending: false })
      .limit(120),
    getPlatformSettings(),
  ])

  if (bannersError) console.error("[admin] promo banners", bannersError)

  return (
    <>
      <ConsoleHeader
        title="Promotions"
        description={`Home-screen banner slots at ${formatRupees(
          settings.promo_daily_rate
        )} a day, and the discounts canteens run`}
      />

      <Tabs defaultValue="banners">
        <TabsList>
          <TabsTrigger value="banners">Home banners</TabsTrigger>
          <TabsTrigger value="offers">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="banners">
          <PromoBannerManagement banners={(banners ?? []) as any} />
        </TabsContent>

        <TabsContent value="offers">
          <PromotionsManagement
            pendingPromotions={(pendingPromotions ?? []) as any}
            approvedPromotions={(approvedPromotions ?? []) as any}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}
