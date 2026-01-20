import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Enterprise middleware for authentication, security, and monitoring
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Security headers
  const response = NextResponse.next()

  // Add security headers (but not for server API)
  if (!pathname.startsWith('/api/server')) {
    response.headers.set('X-Frame-Options', 'DENY')
  }
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // CORS for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  // Rate limiting simulation (in production, use Redis or similar)
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitKey = `rate_limit_${ip}`

  // Authentication check for protected API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const authHeader = request.headers.get('authorization')

    // Allow these API routes without auth
    const publicRoutes = ['/api/search', '/api/files', '/api/server', '/api/execute', '/api/terminal', '/api/packages', '/api/debug', '/api/extensions', '/api/deploy', '/api/database', '/api/collections', '/api/environments', '/api/proxy', '/api/git', '/api/install', '/api/dev']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    if (!authHeader && !isPublicRoute) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // Request logging for monitoring
  console.log(`${new Date().toISOString()} - ${request.method} ${pathname} - ${ip}`)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}