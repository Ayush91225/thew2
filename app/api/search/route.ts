import { NextRequest, NextResponse } from 'next/server'

const MOCK_RESULTS = [
  {
    id: '1',
    type: 'file',
    name: 'MainEditor.tsx',
    path: '/components/MainEditor.tsx',
    content: 'Monaco Editor component with pitch black theme'
  },
  {
    id: '2',
    type: 'file',
    name: 'ide-store.ts',
    path: '/stores/ide-store.ts',
    content: 'Zustand store for IDE state management'
  },
  {
    id: '3',
    type: 'function',
    name: 'useIDEStore',
    path: '/stores/ide-store.ts',
    content: 'Main IDE store hook'
  }
]

function createMatches(query: string, result: any) {
  if (!query) return []
  
  const matches = []
  if (result.name.toLowerCase().includes(query.toLowerCase())) {
    matches.push({ line: 45, text: `const ${result.name.split('.')[0]} = ...` })
  }
  if (result.content.toLowerCase().includes(query.toLowerCase())) {
    matches.push({ line: 12, text: result.content })
  }
  return matches
}

function filterResults(results: any[], query: string) {
  if (!query) return results
  
  const lowerQuery = query.toLowerCase()
  return results.filter(result => 
    result.name.toLowerCase().includes(lowerQuery) ||
    result.content.toLowerCase().includes(lowerQuery)
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 300))

    const filteredResults = filterResults(MOCK_RESULTS, query || '')
    const resultsWithMatches = filteredResults.map(result => ({
      ...result,
      matches: createMatches(query || '', result)
    }))

    return NextResponse.json({
      query,
      results: resultsWithMatches,
      total: resultsWithMatches.length,
      took: Math.floor(Math.random() * 100) + 50
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