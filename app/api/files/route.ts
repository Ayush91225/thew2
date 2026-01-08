import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

// Ensure workspace directory exists
async function ensureWorkspaceDir() {
  try {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

// Get file tree recursively
async function getFileTree(dirPath: string, relativePath = ''): Promise<any[]> {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    const result = []
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name)
      const relativeItemPath = path.join(relativePath, item.name)
      
      if (item.isDirectory()) {
        const children = await getFileTree(itemPath, relativeItemPath)
        result.push({
          name: item.name,
          path: relativeItemPath,
          type: 'directory',
          children
        })
      } else {
        result.push({
          name: item.name,
          path: relativeItemPath,
          type: 'file'
        })
      }
    }
    
    return result.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'directory') return 1
      return a.name.localeCompare(b.name)
    })
  } catch (error) {
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureWorkspaceDir()
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const action = searchParams.get('action')
    
    // List files in directory
    if (action === 'list') {
      const fileTree = await getFileTree(WORKSPACE_DIR)
      return NextResponse.json({ files: fileTree })
    }
    
    // Read specific file
    if (!filePath) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 })
    }
    
    const fullPath = path.join(WORKSPACE_DIR, filePath)
    const content = await fs.readFile(fullPath, 'utf-8')
    
    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureWorkspaceDir()
    const { path: filePath, content, type } = await request.json()
    
    if (!filePath) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 })
    }
    
    const fullPath = path.join(WORKSPACE_DIR, filePath)
    
    if (type === 'directory') {
      await fs.mkdir(fullPath, { recursive: true })
    } else {
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, content || '', 'utf-8')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create file/directory' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 })
    }
    
    const fullPath = path.join(WORKSPACE_DIR, filePath)
    
    try {
      const stats = await fs.stat(fullPath)
      if (stats.isDirectory()) {
        await fs.rmdir(fullPath, { recursive: true })
      } else {
        await fs.unlink(fullPath)
      }
      
      return NextResponse.json({ success: true })
    } catch (error) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { oldPath, newPath } = await request.json()
    
    if (!oldPath || !newPath) {
      return NextResponse.json({ error: 'Old and new paths required' }, { status: 400 })
    }
    
    const oldFullPath = path.join(WORKSPACE_DIR, oldPath)
    const newFullPath = path.join(WORKSPACE_DIR, newPath)
    
    await fs.mkdir(path.dirname(newFullPath), { recursive: true })
    await fs.rename(oldFullPath, newFullPath)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 })
  }
}