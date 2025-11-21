import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

async function getRedirectPath(userId: string) {
  const supabase = await createClient()
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()

  if (!userProfile) {
    return "/home" // Default fallback
  }

  // Redirect based on role
  switch (userProfile.role) {
    case "admin":
      return "/admin"
    case "canteen_owner":
      // Check if owner has a canteen
      const { data: canteen } = await supabase
        .from("canteens")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle()
      return canteen ? "/canteen" : "/canteen/register"
    case "user":
    default:
      return "/home"
  }
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not logged in, redirect to login page
  if (!user) {
    redirect("/login")
  }

  // If user is logged in, redirect based on role
  const redirectPath = await getRedirectPath(user.id)
  redirect(redirectPath)
}

