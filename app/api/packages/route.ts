import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Check available package managers
    const managers = []
    
    try {
      await execAsync('npm --version')
      managers.push({ name: 'npm', version: await execAsync('npm --version').then(r => r.stdout.trim()) })
    } catch {}
    
    try {
      await execAsync('yarn --version')
      managers.push({ name: 'yarn', version: await execAsync('yarn --version').then(r => r.stdout.trim()) })
    } catch {}
    
    return NextResponse.json({ success: true, managers })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to check package managers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, packages, manager = 'npm' } = await request.json()
    
    switch (action) {
      case 'install':
        const installCmd = manager === 'yarn' ? `yarn add ${packages.join(' ')}` : `npm install ${packages.join(' ')}`
        const { stdout, stderr } = await execAsync(installCmd, { cwd: process.cwd() + '/workspace' })
        return NextResponse.json({ success: !stderr, output: stdout || stderr })
        
      case 'uninstall':
        const uninstallCmd = manager === 'yarn' ? `yarn remove ${packages.join(' ')}` : `npm uninstall ${packages.join(' ')}`
        const result = await execAsync(uninstallCmd, { cwd: process.cwd() + '/workspace' })
        return NextResponse.json({ success: !result.stderr, output: result.stdout || result.stderr })
        
      case 'list':
        const listCmd = manager === 'yarn' ? 'yarn list --depth=0' : 'npm list --depth=0'
        const listResult = await execAsync(listCmd, { cwd: process.cwd() + '/workspace' })
        return NextResponse.json({ success: true, output: listResult.stdout })
        
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}