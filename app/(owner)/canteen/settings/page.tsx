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
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent md:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage your canteen profile and preferences
        </p>
      </div>

      <CanteenSettings canteen={canteen} categories={categories || []} />
    </div>
  )
}

