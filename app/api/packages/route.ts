import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ success: true, packages: [] })
}

export async function POST() {
  return NextResponse.json({ success: true })
}