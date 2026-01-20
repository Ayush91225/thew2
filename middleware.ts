import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Enterprise middleware for authentication, security, and monitoring
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Security headers
  const response = NextResponse.next()
<<<<<<< HEAD

=======
  
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
  // Add security headers (but not for server API)
  if (!pathname.startsWith('/api/server')) {
    response.headers.set('X-Frame-Options', 'DENY')
  }
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
<<<<<<< HEAD

=======
  
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
  // CORS for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  // Rate limiting simulation (in production, use Redis or similar)
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitKey = `rate_limit_${ip}`
<<<<<<< HEAD

  // Authentication check for protected API routes and pages
  if (!pathname.startsWith('/_next') && !pathname.startsWith('/favicon.ico')) {
    // Add paths that don't require auth
    const publicPaths = ['/login', '/api/auth']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    if (!isPublicPath) {
      // This is a client-side app mostly, but we can do basic redirection here
      // However, since we're using client-side zustand auth, we can't fully validate session in middleware purely without cookies
      // For now, we'll rely on client-side checks for the view, but let's strictly protect /api routes that need auth
    }

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
=======
  
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
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
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