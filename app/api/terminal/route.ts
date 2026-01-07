import { NextRequest, NextResponse } from 'next/server'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const TIMEOUT = 60000

// Store running processes
const runningProcesses = new Map<string, any>()

const ALLOWED_COMMANDS = [
  'ls', 'pwd', 'cat', 'echo', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'cd',
  'node', 'python3', 'python', 'npm', 'yarn', 'pnpm', 'git', 'curl', 'wget',
  'ps', 'kill', 'which', 'whoami', 'date', 'clear', 'help'
]

export async function POST(request: NextRequest) {
  try {
    const { command, cwd, sessionId } = await request.json()
    
    if (!command) {
      return NextResponse.json({ error: 'Command required' }, { status: 400 })
    }

    const cmdParts = command.trim().split(' ')
    const baseCmd = cmdParts[0]
    
    // Handle built-in commands
    if (baseCmd === 'clear') {
      return NextResponse.json({
        success: true,
        output: '',
        clear: true,
        exitCode: 0
      })
    }

    if (baseCmd === 'help') {
      const helpText = `Available commands:
${ALLOWED_COMMANDS.join(', ')}

Package managers: npm, yarn, pnpm
Development: npm run dev, npm start, node <file>
Version control: git status, git add, git commit
File operations: ls, cat, mkdir, touch, rm, cp, mv`
      return NextResponse.json({
        success: true,
        output: helpText,
        exitCode: 0
      })
    }
    
    if (!ALLOWED_COMMANDS.includes(baseCmd)) {
      return NextResponse.json({ 
        success: false,
        error: `Command '${baseCmd}' not found`,
        output: `bash: ${baseCmd}: command not found`,
        exitCode: 127
      })
    }

    // Ensure workspace directory exists
    try {
      await fs.mkdir(WORKSPACE_DIR, { recursive: true })
    } catch (e) {}

    const workingDir = cwd ? path.resolve(WORKSPACE_DIR, cwd) : WORKSPACE_DIR
    
    // Handle long-running commands (npm run dev, etc.)
    if ((baseCmd === 'npm' && cmdParts.includes('dev')) || 
        (baseCmd === 'npm' && cmdParts.includes('start')) ||
        (baseCmd === 'yarn' && cmdParts.includes('dev'))) {
      
      const processId = `${sessionId}-${Date.now()}`
      
      return new Promise((resolve) => {
        const child = spawn(baseCmd, cmdParts.slice(1), {
          cwd: workingDir,
          env: { ...process.env, PATH: process.env.PATH },
          stdio: ['pipe', 'pipe', 'pipe']
        })

        runningProcesses.set(processId, child)
        
        let output = ''
        let hasResolved = false
        
        const resolveOnce = (data: any) => {
          if (!hasResolved) {
            hasResolved = true
            resolve(NextResponse.json({
              success: true,
              output: data.output,
              processId,
              running: true,
              exitCode: 0
            }))
          }
        }

        child.stdout?.on('data', (data) => {
          output += data.toString()
          if (output.includes('Ready') || output.includes('Local:') || output.includes('localhost')) {
            resolveOnce({ output })
          }
        })

        child.stderr?.on('data', (data) => {
          output += data.toString()
          if (output.includes('Ready') || output.includes('Local:') || output.includes('localhost')) {
            resolveOnce({ output })
          }
        })

        child.on('error', (error) => {
          runningProcesses.delete(processId)
          if (!hasResolved) {
            hasResolved = true
            resolve(NextResponse.json({
              success: false,
              error: error.message,
              output,
              exitCode: 1
            }))
          }
        })

        child.on('exit', (code) => {
          runningProcesses.delete(processId)
          if (!hasResolved) {
            hasResolved = true
            resolve(NextResponse.json({
              success: code === 0,
              output,
              exitCode: code || 0
            }))
          }
        })

        // Timeout for initial response
        setTimeout(() => {
          if (!hasResolved) {
            resolveOnce({ output: output || 'Starting development server...' })
          }
        }, 3000)
      })
    }

    const startTime = Date.now()
    
    try {
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
        executionTime: error.killed ? TIMEOUT : Date.now() - startTime
      })
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      output: '',
      exitCode: 1
    }, { status: 500 })
  }
}

// Kill running process
export async function DELETE(request: NextRequest) {
  try {
    const { processId } = await request.json()
    
    const process = runningProcesses.get(processId)
    if (process) {
      process.kill('SIGTERM')
      runningProcesses.delete(processId)
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Process not found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to kill process' }, { status: 500 })
  }
}