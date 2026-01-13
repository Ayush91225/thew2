import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const MAX_FILE_SIZE = 1000000 // 1MB
const MAX_FILES = 50
const MAX_FILENAME_LENGTH = 100

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

function sanitizeFilePath(filePath: string): string {
  return filePath.replace(/[^a-zA-Z0-9._/-]/g, '').replace(/\.\./g, '')
}

function isValidFilePath(filePath: string): boolean {
  const sanitized = sanitizeFilePath(filePath)
  return sanitized.length > 0 && sanitized.length <= MAX_FILENAME_LENGTH && !sanitized.includes('..')
}

function getSafePath(filePath: string): string | null {
  if (!isValidFilePath(filePath)) return null
  const safePath = path.join(WORKSPACE_DIR, sanitizeFilePath(filePath))
  if (!safePath.startsWith(WORKSPACE_DIR)) return null
  return safePath
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'text/plain'
}

const handleError = (message: string, status = 500) => 
  new NextResponse(message, { status })

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('file') || 'index.html'
    
    const safePath = getSafePath(filePath)
    if (!safePath) {
      return handleError('Invalid file path', 400)
    }
    
    try {
      await fs.access(safePath)
    } catch {
      if (filePath === 'index.html') {
        const defaultContent = `<!DOCTYPE html>\n<html><head><title>Kriya IDE</title></head><body><h1>Welcome to Kriya IDE</h1><p>Start editing to see changes!</p></body></html>`
        await fs.mkdir(path.dirname(safePath), { recursive: true })
        await fs.writeFile(safePath, defaultContent, 'utf-8')
      } else {
        return handleError('File not found', 404)
      }
    }
    
    const stats = await fs.stat(safePath)
    if (stats.size > MAX_FILE_SIZE) {
      return handleError('File too large', 413)
    }
    
    const content = await fs.readFile(safePath, 'utf-8')
    const mimeType = getMimeType(filePath)
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch {
    return handleError('Server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json()
    
    if (!files || typeof files !== 'object') {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }
    
    const fileEntries = Object.entries(files)
    if (fileEntries.length === 0 || fileEntries.length > MAX_FILES) {
      return NextResponse.json({ error: 'Invalid number of files' }, { status: 400 })
    }
    
    await fs.mkdir(WORKSPACE_DIR, { recursive: true })
    
    const htmlFiles: string[] = []
    const validFiles: Array<[string, string]> = []
    
    for (const [filePath, content] of fileEntries) {
      if (typeof content !== 'string' || content.length > MAX_FILE_SIZE) continue
      if (!isValidFilePath(filePath)) continue
      
      validFiles.push([filePath, content])
      
      if (filePath.endsWith('.html') || content.includes('<!DOCTYPE html>') || content.includes('<html')) {
        htmlFiles.push(filePath)
      }
    }
    
    if (htmlFiles.length === 0) {
      return NextResponse.json({ error: 'No HTML file found' }, { status: 400 })
    }
    
    for (const [filePath, content] of validFiles) {
      const safePath = getSafePath(filePath)
      if (!safePath) continue
      
      try {
        await fs.mkdir(path.dirname(safePath), { recursive: true })
        await fs.writeFile(safePath, content, 'utf-8')
      } catch {
        continue
      }
    }
    
    const entryFile = htmlFiles.find(name => name.includes('index')) || htmlFiles[0]
    
    return NextResponse.json({ 
      success: true, 
      url: `/api/server?file=${encodeURIComponent(entryFile)}`,
      entryFile
    })
  } catch {
    return NextResponse.json({ error: 'Failed to start server' }, { status: 500 })
  }
}