import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const { path, packageManager } = await request.json()
    const cmd = packageManager === 'npm' ? 'npm run dev' : `${packageManager} dev`
    exec(`cd ${path} && ${cmd}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
