import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const TIMEOUT = 30000

const ALLOWED_COMMANDS = [
  'ls', 'pwd', 'cat', 'echo', 'mkdir', 'touch', 'rm', 'cp', 'mv',
  'node', 'python3', 'python', 'npm', 'yarn', 'git'
]

export async function POST(request: NextRequest) {
  try {
    const { command, cwd } = await request.json()
    
    if (!command) {
      return NextResponse.json({ error: 'Command required' }, { status: 400 })
    }

    const cmdParts = command.trim().split(' ')
    const baseCmd = cmdParts[0]
    
    if (!ALLOWED_COMMANDS.includes(baseCmd)) {
      return NextResponse.json({ 
        error: `Command '${baseCmd}' not allowed`,
        output: '',
        exitCode: 1
      })
    }

    const workingDir = cwd ? path.join(WORKSPACE_DIR, cwd) : WORKSPACE_DIR
    
    const startTime = Date.now()
    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDir,
      timeout: TIMEOUT,
      env: { ...process.env, PATH: process.env.PATH }
    })

    return NextResponse.json({
      success: true,
      output: stdout || stderr,
      error: stderr,
      exitCode: 0,
      executionTime: Date.now() - startTime
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message,
      exitCode: error.code || 1,
      executionTime: error.killed ? TIMEOUT : 0
    })
  }
}