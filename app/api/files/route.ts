import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
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
    const { path: filePath, content } = await request.json()
    
    if (!filePath || content === undefined) {
      return NextResponse.json({ error: 'Path and content required' }, { status: 400 })
    }
    
    const fullPath = path.join(WORKSPACE_DIR, filePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, content, 'utf-8')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
  }
}