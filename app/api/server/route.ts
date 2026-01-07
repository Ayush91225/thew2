import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

const getMimeType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
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
  return mimeTypes[ext] || 'text/plain'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('file') || 'index.html'
    
    console.log('Server GET request for file:', filePath)
    
    const fullPath = path.join(WORKSPACE_DIR, filePath)
    
    // Check if file exists, if not create a default
    try {
      await fs.access(fullPath)
    } catch {
      console.log('File not found, creating default:', filePath)
      if (filePath === 'index.html') {
        const defaultContent = `<!DOCTYPE html>
<html><head><title>Kriya IDE</title></head><body><h1>Welcome to Kriya IDE</h1><p>Start editing to see changes!</p></body></html>`
        await fs.mkdir(path.dirname(fullPath), { recursive: true })
        await fs.writeFile(fullPath, defaultContent, 'utf-8')
      } else {
        console.log('File not found and not index.html:', filePath)
        return new NextResponse('File not found', { status: 404 })
      }
    }
    
    const content = await fs.readFile(fullPath, 'utf-8')
    console.log('Serving file content length:', content.length)
    const mimeType = getMimeType(filePath)
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'X-Frame-Options': 'ALLOWALL'
      }
    })
  } catch (error) {
    console.error('Server GET error:', error)
    return new NextResponse('Server error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json()
    console.log('Server POST - received files:', Object.keys(files))
    
    // Save all files to workspace
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(WORKSPACE_DIR, filePath)
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, content as string, 'utf-8')
      console.log('Saved file:', filePath, 'length:', (content as string).length)
    }
    
    // Find HTML file to serve as entry point
    const htmlFiles = Object.keys(files).filter(name => name.endsWith('.html'))
    const entryFile = htmlFiles.includes('index.html') ? 'index.html' : htmlFiles[0] || 'index.html'
    
    console.log('Entry file determined:', entryFile)
    
    return NextResponse.json({ 
      success: true, 
      url: `/api/server?file=${entryFile}`,
      entryFile
    })
  } catch (error) {
    console.error('Server POST error:', error)
    return NextResponse.json({ error: 'Failed to start server' }, { status: 500 })
  }
}