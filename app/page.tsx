import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not logged in, redirect to login page
  if (!user) {
    redirect("/login")
  }

  // If user is logged in, redirect to home page
  redirect("/home")
}

