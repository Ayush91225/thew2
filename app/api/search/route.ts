import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ query, results: [], total: 0, took: 0 })
    }

    // Return empty results - search is handled client-side
    return NextResponse.json({
      query,
      results: [],
      total: 0,
      took: 0
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