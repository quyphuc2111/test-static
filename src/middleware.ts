import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, type AppSession } from '@/lib/session'

// Danh sách các đường dẫn công khai (không cần đăng nhập)
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/about',
  '/api/auth/login',
  '/api/auth/logout',
  '/uploads',
]

// Kiểm tra xem path có phải là public không
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cho phép /uploads với CORS headers để nhúng vào trang khác
  if (pathname.startsWith('/uploads')) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.set('X-Frame-Options', 'ALLOWALL')
    response.headers.delete('X-Frame-Options')
    return response
  }

  // Kiểm tra nếu là public path thì cho phép truy cập
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Kiểm tra session cho các trang protected
  try {
    const response = NextResponse.next()
    const session = await getIronSession<AppSession>(request, response, sessionOptions)

    // Nếu không có session, redirect đến login
    if (!session.user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  } catch (error) {
    // Nếu có lỗi khi đọc session, redirect đến login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
