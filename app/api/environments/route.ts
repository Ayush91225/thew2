import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const ENVIRONMENTS_DIR = path.join(process.cwd(), 'data', 'api-environments')

function validateId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 50
}

function getSafePath(id: string): string | null {
  if (!validateId(id)) return null
  const filePath = path.join(ENVIRONMENTS_DIR, `${id}.json`)
  if (!filePath.startsWith(ENVIRONMENTS_DIR)) return null
  return filePath
}

const handleError = (message: string, status = 500) => 
  NextResponse.json({ error: message }, { status })

async function ensureEnvironmentsDir() {
  try {
    await fs.mkdir(ENVIRONMENTS_DIR, { recursive: true })
  } catch {
    throw new Error('Failed to create environments directory')
  }
}

export async function GET() {
  try {
    await ensureEnvironmentsDir()
    const files = await fs.readdir(ENVIRONMENTS_DIR)
    const environments = []
    
    for (const file of files) {
      if (file.endsWith('.json') && /^[a-zA-Z0-9_-]+\.json$/.test(file)) {
        try {
          const filePath = getSafePath(file.replace('.json', ''))
          if (!filePath) continue
          
          const content = await fs.readFile(filePath, 'utf-8')
          const environment = JSON.parse(content)
          environments.push({
            id: file.replace('.json', ''),
            name: environment.name || 'Untitled',
            variableCount: Object.keys(environment.variables || {}).length
          })
        } catch {
          continue
        }
      }
    }
    
    return NextResponse.json({ environments })
  } catch {
    return handleError('Failed to load environments')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, variables } = await request.json()
    
    if (!name || typeof name !== 'string' || name.length > 100) {
      return handleError('Invalid name', 400)
    }
    
    if (variables && typeof variables !== 'object') {
      return handleError('Invalid variables', 400)
    }
    
    await ensureEnvironmentsDir()
    
    const environmentId = Date.now().toString()
    const environment = {
      id: environmentId,
      name: name.trim(),
      variables: variables || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const filePath = getSafePath(environmentId)
    if (!filePath) {
      return handleError('Invalid environment ID', 400)
    }
    
    await fs.writeFile(filePath, JSON.stringify(environment, null, 2))
    
    return NextResponse.json({ 
      message: 'Environment saved successfully',
      environment: {
        id: environment.id,
        name: environment.name,
        variableCount: Object.keys(environment.variables).length
      }
    })
  } catch {
    return handleError('Failed to save environment')
  }
}