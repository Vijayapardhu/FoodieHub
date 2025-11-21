import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Get user after session exchange
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Redirect based on role
      const redirectPath = await getRedirectPath(user.id)
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Fallback: redirect to root (which will handle redirect)
  return NextResponse.redirect(`${origin}/`)
}

