import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'fc26_session'

// Coarse redirect: if no session cookie, send to /login for protected routes.
// Full validation (token hash lookup + DB) happens in server components via getSessionProfile().
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has(COOKIE_NAME)

  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/matches') ||
    pathname.startsWith('/leaderboard') ||
    pathname.startsWith('/players') ||
    pathname.startsWith('/player')

  const isAuthRoute = pathname.startsWith('/login')

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && hasSession) {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/matches/:path*',
    '/leaderboard/:path*',
    '/players/:path*',
    '/player/:path*',
    '/login',
  ],
}
