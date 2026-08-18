import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that must render without a session.
//
// /offline in particular is the service worker's navigation fallback: a user
// with no connection has no way to refresh their session, so redirecting it
// to /login means the offline page can never actually be shown.
// '/credits' carries the photo attribution the image licences require, so it
// has to be reachable without an account — a licence obligation behind a
// login wall is not discharged.
const PUBLIC_PREFIXES = [
  '/login',
  '/auth',
  '/offline',
  '/credits',
  // A canteen applying to join has no account yet, and the legal pages have
  // to be readable by somebody deciding whether to make one.
  '/register-canteen',
  '/terms',
  '/privacy',
  '/about',
  // Razorpay calls this server-to-server, with no session cookie of any
  // kind — the redirect-to-login fast path above would otherwise swallow
  // every webhook delivery before the route's own signature check ever
  // runs. The signature check is what actually guards this endpoint.
  '/api/payments/razorpay/webhook',
]

/**
 * Supabase stores the session in `sb-<project-ref>-auth-token`, chunked across
 * `.0`, `.1`… when it is large. If none of those cookies are present there is
 * categorically no session, and `getUser()` — a network call to Supabase on
 * every single request — cannot tell us anything we don't already know.
 */
function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute =
    // The marketing landing page. This is the link that goes on posters, in
    // WhatsApp groups and on the QR code, so it has to render to strangers.
    pathname === '/' ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  // Fast path for signed-out traffic: no cookie means no session to refresh
  // and nothing to validate, so skip the auth round trip entirely. This is
  // most of the load on /login itself, which every cold visit passes through.
  if (!hasSessionCookie(request)) {
    if (isPublicRoute) return NextResponse.next({ request })

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Root path: send a signed-in visitor to their own console.
  //
  // Sign-in no longer routes through here — the login form and the OAuth
  // callback resolve the destination themselves — so this now only runs when
  // somebody opens the bare domain with a live session.
  if (pathname === '/') {
    if (!user) return supabaseResponse

    const url = request.nextUrl.clone()
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role === 'admin') {
        url.pathname = '/admin'
      } else if (profile?.role === 'canteen_owner') {
        const { data: canteen } = await supabase
          .from('canteens')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle()

        url.pathname = canteen ? '/canteen' : '/canteen/register'
      } else {
        url.pathname = '/home'
      }
    } catch {
      url.pathname = '/home'
    }
    return NextResponse.redirect(url)
  }

  // A stale or revoked cookie survives the fast path above but fails here.
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Deliberately *not* bouncing a signed-in visitor away from /login: with
  // three roles in play, switching accounts is a normal thing to want to do.

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
