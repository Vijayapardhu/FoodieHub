import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { CanteenSettings } from "@/components/canteen-owner/canteen-settings"

export const metadata = { title: "Canteen settings" }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: canteen } = await supabase
    .from("canteens")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!canteen) redirect("/canteen")

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  return (
    <>
      <ConsoleHeader
        title="Canteen settings"
        description="Profile, imagery, location and opening hours"
      />

      <div className="mx-auto max-w-2xl pb-24 md:pb-0">
        <CanteenSettings canteen={canteen} categories={categories ?? []} />
      </div>
    </>
  )
}
