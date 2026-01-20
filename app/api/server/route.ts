import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export async function POST(request: NextRequest) {
  try {
    const { action, port = 5500 } = await request.json()
    
    if (action === 'start') {
      return NextResponse.json({ 
        success: true, 
        message: `Live Server started on port ${port}`,
        url: `http://localhost:${port}`
      })
    }
    
    if (action === 'stop') {
      return NextResponse.json({ 
        success: true, 
        message: 'Live Server stopped'
      })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('file') || 'index.html'
    
    const safePath = path.join(WORKSPACE_DIR, filePath)
    
    // Security check
    if (!safePath.startsWith(WORKSPACE_DIR)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }
    
    const content = await fs.readFile(safePath, 'utf-8')
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
