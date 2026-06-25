import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow admin login page without token
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.next()
  }

  // Protect other admin routes (dashboard, products, orders)
  if (pathname.startsWith('/admin/')) {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
