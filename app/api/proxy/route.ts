import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = [
  'api.github.com',
  'jsonplaceholder.typicode.com',
  'httpbin.org',
  'reqres.in'
]

const BLOCKED_PORTS = [22, 23, 25, 53, 80, 135, 139, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5984, 6379, 7001, 8080, 9200, 27017]

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    
    // Only allow HTTPS
    if (url.protocol !== 'https:') return false
    
    // Check if host is in allowed list
    if (!ALLOWED_HOSTS.includes(url.hostname)) return false
    
    // Block dangerous ports
    const port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80)
    if (BLOCKED_PORTS.includes(port)) return false
    
    // Block private IP ranges
    const ip = url.hostname
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|169\.254\.|::1|localhost)/.test(ip)) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

const handleError = (message: string, status = 500) => 
  NextResponse.json({ error: message }, { status })

export async function POST(request: NextRequest) {
  try {
    const { method, url, headers, body } = await request.json()
    
    if (!url || typeof url !== 'string') {
      return handleError('URL is required', 400)
    }
    
    if (!isValidUrl(url)) {
      return handleError('URL not allowed', 403)
    }
    
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    const requestMethod = method || 'GET'
    
    if (!allowedMethods.includes(requestMethod)) {
      return handleError('Method not allowed', 405)
    }
    
    const safeHeaders = {
      'User-Agent': 'KRIYA-IDE/1.0',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': headers?.['Content-Type'] || 'application/json'
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const fetchOptions: RequestInit = {
      method: requestMethod,
      headers: safeHeaders,
      signal: controller.signal
    }
    
    if (requestMethod !== 'GET' && body) {
      if (typeof body === 'string' && body.length > 100000) {
        return handleError('Request body too large', 413)
      }
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }
    
    const startTime = Date.now()
    const response = await fetch(url, fetchOptions)
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    if (responseTime > 30000) {
      return handleError('Request timeout', 408)
    }
    
    let responseData
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const text = await response.text()
      if (text.length > 1000000) {
        return handleError('Response too large', 413)
      }
      responseData = JSON.parse(text)
    } else {
      responseData = await response.text()
      if (responseData.length > 1000000) {
        return handleError('Response too large', 413)
      }
    }
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      time: responseTime
    })
    
  } catch {
    return handleError('Proxy request failed')
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API Proxy Service',
    version: '1.0.0',
    allowedHosts: ALLOWED_HOSTS
  })
}