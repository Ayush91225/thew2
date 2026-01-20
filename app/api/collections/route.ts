import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const COLLECTIONS_DIR = path.join(process.cwd(), 'data', 'api-collections')

function sanitizeString(str: string): string {
  return str.replace(/[<>"'&]/g, (match) => {
    const map: { [key: string]: string } = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    }
    return map[match]
  })
}

function validateCollectionData(data: any): boolean {
  return data && 
         typeof data.name === 'string' && 
         data.name.length > 0 && 
         data.name.length <= 100 &&
         Array.isArray(data.requests) &&
         data.requests.length <= 1000
}

// Ensure collections directory exists
async function ensureCollectionsDir() {
  try {
    await fs.mkdir(COLLECTIONS_DIR, { recursive: true })
  } catch (error) {
    throw new Error('Failed to create collections directory')
  }
}

export async function GET() {
  try {
    await ensureCollectionsDir()
    const files = await fs.readdir(COLLECTIONS_DIR)
    const collections = []
    
    for (const file of files) {
      if (file.endsWith('.json') && /^[a-zA-Z0-9_-]+\.json$/.test(file)) {
        try {
          const filePath = path.join(COLLECTIONS_DIR, file)
          // Ensure path is within collections directory
          if (!filePath.startsWith(COLLECTIONS_DIR)) continue
          
          const content = await fs.readFile(filePath, 'utf-8')
          const collection = JSON.parse(content)
          collections.push({
            id: sanitizeString(file.replace('.json', '')),
            name: sanitizeString(collection.name || 'Untitled'),
            requestCount: Array.isArray(collection.requests) ? collection.requests.length : 0,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt
          })
        } catch (error) {
          // Skip invalid files
          continue
        }
      }
    }
    
    return NextResponse.json({ collections })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load collections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!validateCollectionData(data)) {
      return NextResponse.json({ error: 'Invalid collection data' }, { status: 400 })
    }
    
    await ensureCollectionsDir()
    
    const collectionId = Date.now().toString()
    // Validate collection ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 })
    }
    
    const collection = {
      id: collectionId,
      name: sanitizeString(data.name.trim()),
      requests: data.requests.slice(0, 1000), // Limit requests
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const filePath = path.join(COLLECTIONS_DIR, `${collectionId}.json`)
    // Ensure path is within collections directory
    if (!filePath.startsWith(COLLECTIONS_DIR)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }
    
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2))
    
    return NextResponse.json({ 
      message: 'Collection saved successfully',
      collection: {
        id: collection.id,
        name: collection.name,
        requestCount: collection.requests.length
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save collection' }, { status: 500 })
  }
}