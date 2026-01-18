import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

async function searchFiles(dir: string, query: string, results: any[] = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await searchFiles(fullPath, query, results)
        }
      } else if (entry.isFile()) {
        const relativePath = path.relative(WORKSPACE_DIR, fullPath)
        const fileName = entry.name
        
        // Check if filename matches
        if (fileName.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: fullPath,
            type: 'file',
            name: relativePath,
            path: fullPath,
            content: 'Filename match',
            matches: [{ line: 1, text: `File: ${fileName}` }],
            priority: 1
          })
        } else {
          // Search file content
          const content = await fs.readFile(fullPath, 'utf-8')
          const lines = content.split('\n')
          const matches: any[] = []
          
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              matches.push({ line: idx + 1, text: line.trim() })
            }
          })
          
          if (matches.length > 0) {
            results.push({
              id: fullPath,
              type: 'file',
              name: relativePath,
              path: fullPath,
              content: `${matches.length} matches`,
              matches: matches.slice(0, 10),
              priority: 2
            })
          }
        }
      }
    }
  } catch {}
  return results
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ query, results: [], total: 0, took: 0 })
    }

    const start = Date.now()
    const results = await searchFiles(WORKSPACE_DIR, query)
    results.sort((a, b) => (a.priority || 2) - (b.priority || 2))
    const took = Date.now() - start

    return NextResponse.json({
      query,
      results,
      total: results.length,
      took
    })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, replace, files } = body

    if (!query || !replace) {
      return NextResponse.json({ error: 'Query and replace text required' }, { status: 400 })
    }

    // Simulate replace operation
    await new Promise(resolve => setTimeout(resolve, 500))

    const replacements = (files || []).map((file: string) => ({
      file,
      replacements: Math.floor(Math.random() * 5) + 1
    }))

    const total = replacements.reduce((sum: number, r: any) => sum + r.replacements, 0)

    return NextResponse.json({
      success: true,
      query,
      replace,
      files: replacements,
      total
    })
  } catch {
    return NextResponse.json({ error: 'Replace operation failed' }, { status: 500 })
  }
}