import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const COLLECTIONS_DIR = path.join(process.cwd(), 'data', 'api-collections')

function validateId(id: string): boolean {
  // Only allow alphanumeric characters, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 50
}

function getSafePath(id: string): string | null {
  if (!validateId(id)) return null
  const filePath = path.join(COLLECTIONS_DIR, `${id}.json`)
  // Ensure the resolved path is within COLLECTIONS_DIR
  if (!filePath.startsWith(COLLECTIONS_DIR)) return null
  return filePath
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const filePath = getSafePath(params.id)
    if (!filePath) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 })
    }
    
    const content = await fs.readFile(filePath, 'utf-8')
    const collection = JSON.parse(content)
    
    return NextResponse.json({ collection })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to read collection' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const filePath = getSafePath(params.id)
    if (!filePath) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 })
    }
    
    const { name, requests } = await request.json()
    
    // Ensure directory exists
    await fs.mkdir(COLLECTIONS_DIR, { recursive: true })
    
    // Read existing collection
    let existingCollection: any = {}
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      existingCollection = JSON.parse(content)
    } catch (error) {
      // File doesn't exist, create new
    }
    
    // Update collection
    const updatedCollection = {
      ...existingCollection,
      id: params.id,
      name: name || existingCollection.name || 'Untitled Collection',
      requests: requests || existingCollection.requests || [],
      updatedAt: new Date().toISOString()
    }
    
    await fs.writeFile(filePath, JSON.stringify(updatedCollection, null, 2))
    
    return NextResponse.json({ 
      message: 'Collection updated successfully',
      collection: {
        id: updatedCollection.id,
        name: updatedCollection.name,
        requestCount: updatedCollection.requests.length
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const filePath = getSafePath(params.id)
    if (!filePath) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 })
    }
    
    await fs.unlink(filePath)
    
    return NextResponse.json({ 
      message: 'Collection deleted successfully' 
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
  }
}