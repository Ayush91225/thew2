import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path') || '/'
    
    const fullPath = path.join(WORKSPACE_DIR, filePath)
    await fs.mkdir(WORKSPACE_DIR, { recursive: true })
    
    const stats = await fs.stat(fullPath).catch(() => null)
    if (!stats) {
      return NextResponse.json({ success: false, error: 'Path not found' }, { status: 404 })
    }
    
    if (stats.isDirectory()) {
      const entries = await fs.readdir(fullPath, { withFileTypes: true })
      const files = await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(fullPath, entry.name)
        const size = entry.isFile() ? (await fs.stat(entryPath)).size : 0
        return {
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: path.join(filePath, entry.name).replace(/\\/g, '/'),
          size
        }
      }))
      return NextResponse.json({ success: true, files })
    } else {
      const content = await fs.readFile(fullPath, 'utf-8')
      return NextResponse.json({ success: true, content, type: 'file' })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to read files' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, path: filePath, content, name } = await request.json()
    const fullPath = path.join(WORKSPACE_DIR, filePath || '')
    
    switch (action) {
      case 'create':
        if (name) {
          const newPath = path.join(fullPath, name)
          await fs.mkdir(path.dirname(newPath), { recursive: true })
          await fs.writeFile(newPath, content || '', 'utf-8')
          return NextResponse.json({ success: true, path: newPath })
        }
        break
      case 'save':
        await fs.mkdir(path.dirname(fullPath), { recursive: true })
        await fs.writeFile(fullPath, content || '', 'utf-8')
        return NextResponse.json({ success: true })
      case 'delete':
        await fs.unlink(fullPath)
        return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'File operation failed' }, { status: 500 })
  }
}