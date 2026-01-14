import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; lastReset: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // per window

export function rateLimit(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW
  
  const record = rateLimitMap.get(ip)
  
  if (!record || record.lastReset < windowStart) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return true
  }
  
  if (record.count >= MAX_REQUESTS) {
    return false
  }
  
  record.count++
  return true
}

export function createRateLimitResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Rate limit exceeded' },
    { status: 429 }
  )
}
