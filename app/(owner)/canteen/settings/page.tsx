import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CanteenSettings } from "@/components/canteen-owner/canteen-settings"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: canteen } = await supabase
    .from("canteens")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  if (!canteen) {
    redirect("/canteen")
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your canteen profile and preferences
        </p>
      </div>

      <CanteenSettings canteen={canteen} categories={categories || []} />
    </div>
  )
}

