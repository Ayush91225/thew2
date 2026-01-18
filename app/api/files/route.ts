import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_PATH_LENGTH = 255
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json', '.md', '.txt',
  '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb', '.sh', '.yml', '.yaml'
])

function sanitizePath(inputPath: string): string {
  return inputPath.replace(/[^a-zA-Z0-9._/-]/g, '').replace(/\.\./g, '')
}

function validatePath(inputPath: string): boolean {
  if (!inputPath || inputPath.length > MAX_PATH_LENGTH) return false
  if (inputPath.includes('..') || inputPath.startsWith('/')) return false
  return /^[a-zA-Z0-9._/-]+$/.test(inputPath)
}

function validateFileExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ext === '' || ALLOWED_EXTENSIONS.has(ext)
}

function getSafePath(inputPath: string): string | null {
  if (!validatePath(inputPath)) return null
  
  // Normalize and resolve the path
  const sanitized = sanitizePath(inputPath)
  const workspaceResolved = path.resolve(WORKSPACE_DIR)
  const targetResolved = path.resolve(workspaceResolved, sanitized)
  
  // Ensure the resolved path is within workspace
  if (!targetResolved.startsWith(workspaceResolved + path.sep) && targetResolved !== workspaceResolved) {
    return null
  }
  
  return targetResolved
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: Date
  children?: FileNode[]
}

async function buildFileTree(dirPath: string, relativePath = ''): Promise<FileNode[]> {
  try {
    // Ensure we're still within workspace bounds
    const workspaceResolved = path.resolve(WORKSPACE_DIR)
    const currentResolved = path.resolve(dirPath)
    if (!currentResolved.startsWith(workspaceResolved)) {
      return []
    }
    
    const entries = await fs.readdir(currentResolved, { withFileTypes: true })
    const files: FileNode[] = []
    
    for (const entry of entries) {
      const entryPath = path.join(currentResolved, entry.name)
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name
      
      // Skip hidden files and system files
      if (entry.name.startsWith('.') || entry.name.includes('..')) {
        continue
      }
      
      if (entry.isDirectory()) {
        const children = await buildFileTree(entryPath, entryRelativePath)
        files.push({
          name: entry.name,
          path: entryRelativePath,
          type: 'directory',
          children
        })
      } else {
        const stats = await fs.stat(entryPath)
        files.push({
          name: entry.name,
          path: entryRelativePath,
          type: 'file',
          size: stats.size,
          modified: stats.mtime
        })
      }
    }
    
    return files.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  } catch (error) {
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const filePath = searchParams.get('path')
    
    const workspaceResolved = path.resolve(WORKSPACE_DIR)
    
    // Ensure workspace directory exists
    try {
      await fs.mkdir(workspaceResolved, { recursive: true })
    } catch (mkdirError) {
      console.warn('Workspace directory issue:', mkdirError)
    }
    
    if (action === 'list') {
      try {
        const files = await buildFileTree(workspaceResolved)
        return NextResponse.json({ success: true, files })
      } catch (listError) {
        console.warn('Failed to build file tree:', listError)
        return NextResponse.json({ success: true, files: [] })
      }
    }
    
    if (filePath) {
      const safePath = getSafePath(filePath)
      if (!safePath) {
        return NextResponse.json({ success: false, error: 'Invalid file path' }, { status: 400 })
      }
      
      const stats = await fs.stat(safePath)
      if (stats.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: 'File too large' }, { status: 413 })
      }
      
      const content = await fs.readFile(safePath, 'utf-8')
      return NextResponse.json({ success: true, content })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.warn('API /files GET error:', error)
    return NextResponse.json({ success: true, files: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: filePath, content, type } = body
    
    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid path required' }, { status: 400 })
    }
    
    if (content && typeof content === 'string' && content.length > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Content too large' }, { status: 413 })
    }
    
    const safePath = getSafePath(filePath)
    if (!safePath) {
      return NextResponse.json({ success: false, error: 'Invalid file path' }, { status: 400 })
    }
    
    if (!validateFileExtension(path.basename(filePath))) {
      return NextResponse.json({ success: false, error: 'File type not allowed' }, { status: 400 })
    }
    
    await fs.mkdir(path.dirname(safePath), { recursive: true })
    
    if (type === 'directory') {
      await fs.mkdir(safePath, { recursive: true })
    } else {
      await fs.writeFile(safePath, content || '', 'utf-8')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'File operation failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid path required' }, { status: 400 })
    }
    
    const safePath = getSafePath(filePath)
    if (!safePath) {
      return NextResponse.json({ success: false, error: 'Invalid file path' }, { status: 400 })
    }
    
    const stats = await fs.stat(safePath)
    
    if (stats.isDirectory()) {
      await fs.rmdir(safePath, { recursive: true })
    } else {
      await fs.unlink(safePath)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Delete operation failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { oldPath, newPath } = body
    
    if (!oldPath || !newPath || typeof oldPath !== 'string' || typeof newPath !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid oldPath and newPath required' }, { status: 400 })
    }
    
    const safeOldPath = getSafePath(oldPath)
    const safeNewPath = getSafePath(newPath)
    
    if (!safeOldPath || !safeNewPath) {
      return NextResponse.json({ success: false, error: 'Invalid file paths' }, { status: 400 })
    }
    
    if (!validateFileExtension(path.basename(newPath))) {
      return NextResponse.json({ success: false, error: 'New file type not allowed' }, { status: 400 })
    }
    
    await fs.rename(safeOldPath, safeNewPath)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Rename operation failed' }, { status: 500 })
  }
}