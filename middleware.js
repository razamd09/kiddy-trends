import { NextResponse } from 'next/server'

export function middleware(request) {
  const hostname = request.headers.get('host')?.split(':')[0].toLowerCase()
  if (hostname === 'thekiddytrends.com') {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.hostname = 'www.thekiddytrends.com'
    return NextResponse.redirect(canonicalUrl, 308)
  }

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
  matcher: ['/:path*'],
}
