import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Check for auth token in cookie (set server-side) or skip (client checks localStorage)
  // For SSR auth, set a cookie from the API. For now, allow all and let client handle redirect.
  if (isPublic) return NextResponse.next()

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
