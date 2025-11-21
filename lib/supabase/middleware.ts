import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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

  // Allow public access to login and auth pages only
  const isPublicRoute = 
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth')

  // Handle root path redirects
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    if (user) {
      // Get user role and redirect accordingly
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userProfile?.role === 'admin') {
          url.pathname = '/admin'
        } else if (userProfile?.role === 'canteen_owner') {
          // Check if owner has a canteen, if not redirect to register
          const { data: canteen } = await supabase
            .from('canteens')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle()
          
          url.pathname = canteen ? '/canteen' : '/canteen/register'
        } else {
          // Default to user/home
          url.pathname = '/home'
        }
      } catch {
        // If role lookup fails, default to home
        url.pathname = '/home'
      }
      return NextResponse.redirect(url)
    } else {
      // User is not logged in, redirect to login page
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // If user is not logged in and trying to access a protected route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

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

