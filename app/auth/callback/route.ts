import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resolveDestination } from "@/lib/auth/destination"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const origin = requestUrl.origin

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error
      )}&error_description=${encodeURIComponent(
        errorDescription || "An error occurred during sign in"
      )}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          "auth_failed"
        )}&error_description=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // exchangeCodeForSession already returns the user, so the extra
    // getUser() round trip this used to make was pure latency.
    const user = data.session?.user
    if (user) {
      return NextResponse.redirect(
        `${origin}${await resolveDestination(supabase, user.id)}`
      )
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
