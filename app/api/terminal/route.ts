import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')

// Simulated file system for web environment
const simulatedFS = new Map<string, string>()

// Initialize with some default files
if (simulatedFS.size === 0) {
  simulatedFS.set('/workspace/index.html', '<html><body><h1>Hello World</h1></body></html>')
  simulatedFS.set('/workspace/package.json', JSON.stringify({ name: 'workspace', version: '1.0.0' }, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const { command, cwd = '/workspace', sessionId } = await request.json()
    
    if (!command) {
      return NextResponse.json({ error: 'Command required' }, { status: 400 })
    }

    const cmdParts = command.trim().split(' ')
    const baseCmd = cmdParts[0]
    const args = cmdParts.slice(1)
    
    let output = ''
    let success = true
    let exitCode = 0

    switch (baseCmd) {
      case 'clear':
        return NextResponse.json({ success: true, output: '', clear: true, exitCode: 0 })
      
      case 'help':
        output = `Available commands:
ls, pwd, cat, echo, mkdir, touch, rm, cd, clear, help
npm, node, git (simulated)

File operations work with simulated filesystem.
Use 'ls' to see available files.`
        break
      
      case 'ls':
        const currentDir = cwd === '/' ? '/workspace' : cwd
        const files = Array.from(simulatedFS.keys())
          .filter(path => path.startsWith(currentDir) && path !== currentDir)
          .map(path => path.replace(currentDir + '/', '').split('/')[0])
          .filter((file, index, arr) => arr.indexOf(file) === index)
        
        output = files.length > 0 ? files.join('\n') : 'No files found'
        break
      
      case 'pwd':
        output = cwd || '/workspace'
        break
      
      case 'cat':
        if (args.length === 0) {
          output = 'cat: missing file operand'
          success = false
          exitCode = 1
        } else {
          const filePath = args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`
          const content = simulatedFS.get(filePath)
          if (content !== undefined) {
            output = content
          } else {
            output = `cat: ${args[0]}: No such file or directory`
            success = false
            exitCode = 1
          }
        }
        break
      
      case 'echo':
        output = args.join(' ')
        break
      
      case 'touch':
        if (args.length === 0) {
          output = 'touch: missing file operand'
          success = false
          exitCode = 1
        } else {
          const filePath = args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`
          simulatedFS.set(filePath, '')
          output = ''
        }
        break
      
      case 'mkdir':
        if (args.length === 0) {
          output = 'mkdir: missing operand'
          success = false
          exitCode = 1
        } else {
          // Simulate directory creation
          output = ''
        }
        break
      
      case 'rm':
        if (args.length === 0) {
          output = 'rm: missing operand'
          success = false
          exitCode = 1
        } else {
          const filePath = args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`
          if (simulatedFS.has(filePath)) {
            simulatedFS.delete(filePath)
            output = ''
          } else {
            output = `rm: cannot remove '${args[0]}': No such file or directory`
            success = false
            exitCode = 1
          }
        }
        break
      
      case 'npm':
        if (args[0] === 'install' || args[0] === 'i') {
          output = 'npm install completed (simulated)'
        } else if (args[0] === 'run' && args[1] === 'dev') {
          output = 'Starting development server on http://localhost:3000 (simulated)'
        } else if (args[0] === 'start') {
          output = 'Starting production server (simulated)'
        } else {
          output = `npm ${args.join(' ')} (simulated)`
        }
        break
      
      case 'node':
        if (args.length === 0) {
          output = 'Welcome to Node.js (simulated)\nType .exit to quit'
        } else {
          output = `Running: node ${args.join(' ')} (simulated)`
        }
        break
      
      case 'git':
        if (args[0] === 'status') {
          output = 'On branch main\nnothing to commit, working tree clean (simulated)'
        } else if (args[0] === 'add') {
          output = `Added ${args.slice(1).join(' ')} (simulated)`
        } else if (args[0] === 'commit') {
          output = 'Commit created (simulated)'
        } else {
          output = `git ${args.join(' ')} (simulated)`
        }
        break
      
      case 'whoami':
        output = 'dev'
        break
      
      case 'date':
        output = new Date().toString()
        break
      
      default:
        output = `bash: ${baseCmd}: command not found`
        success = false
        exitCode = 127
    }

    return NextResponse.json({
      success,
      output,
      exitCode,
      executionTime: Math.floor(Math.random() * 100) + 50 // Simulate execution time
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      output: error.message,
      exitCode: 1
    }, { status: 500 })
  }
}