import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'

const execAsync = promisify(exec)
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

export async function POST(request: NextRequest) {
  try {
    const { action, packages, manager = 'npm' } = await request.json()
    
    if (!action || !['install', 'uninstall', 'init'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!['npm', 'yarn'].includes(manager)) {
      return NextResponse.json({ error: 'Invalid package manager' }, { status: 400 })
    }

    let command = ''
    
    switch (action) {
      case 'init':
        command = manager === 'npm' ? 'npm init -y' : 'yarn init -y'
        break
      case 'install':
        if (!packages || packages.length === 0) {
          command = manager === 'npm' ? 'npm install' : 'yarn install'
        } else {
          const pkgList = Array.isArray(packages) ? packages.join(' ') : packages
          command = manager === 'npm' ? `npm install ${pkgList}` : `yarn add ${pkgList}`
        }
        break
      case 'uninstall':
        if (!packages || packages.length === 0) {
          return NextResponse.json({ error: 'Packages required for uninstall' }, { status: 400 })
        }
        const pkgList = Array.isArray(packages) ? packages.join(' ') : packages
        command = manager === 'npm' ? `npm uninstall ${pkgList}` : `yarn remove ${pkgList}`
        break
    }

    const startTime = Date.now()
    const { stdout, stderr } = await execAsync(command, {
      cwd: WORKSPACE_DIR,
      timeout: 60000
    })

    return NextResponse.json({
      success: true,
      output: stdout,
      error: stderr,
      command,
      executionTime: Date.now() - startTime
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const packageJsonPath = path.join(WORKSPACE_DIR, 'package.json')
    
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      
      return NextResponse.json({
        exists: true,
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        scripts: packageJson.scripts || {}
      })
    } catch {
      return NextResponse.json({
        exists: false,
        dependencies: {},
        devDependencies: {},
        scripts: {}
      })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read package.json' }, { status: 500 })
  }
}