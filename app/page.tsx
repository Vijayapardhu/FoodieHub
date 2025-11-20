import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Redirect based on role
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userProfile?.role === "admin") {
    redirect("/admin")
  } else if (userProfile?.role === "canteen_owner") {
    redirect("/canteen")
  } else {
    redirect("/home")
  }
}

