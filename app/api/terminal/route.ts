import { NextRequest, NextResponse } from 'next/server'

// Session storage for terminal state
interface TerminalSession {
  cwd: string
  createdAt: number
}

// Simulated file system for web environment
const simulatedFS = new Map<string, string>()
const simulatedDirs = new Set<string>()

// Initialize with empty filesystem
if (simulatedFS.size === 0) {
  // Start with empty workspace
  simulatedDirs.add('/workspace')
}

// Store terminal sessions (in production, use Redis or database)
const terminalSessions = new Map<string, TerminalSession>()

export async function POST(request: NextRequest) {
  try {
    const { command, sessionId } = await request.json()
    
    if (!command) {
      return NextResponse.json({ error: 'Command required' }, { status: 400 })
    }

    // Get or create session
    let session: TerminalSession
    if (sessionId && terminalSessions.has(sessionId)) {
      session = terminalSessions.get(sessionId)!
    } else {
      const newSessionId = sessionId || `session_${Date.now()}`
      session = { 
        cwd: '/workspace',
        createdAt: Date.now()
      }
      terminalSessions.set(newSessionId, session)
    }

    // Sanitize command input
    const sanitizedCommand = command.replace(/[<>"'&]/g, '')
    const cmdParts = sanitizedCommand.trim().split(' ')
    const baseCmd = cmdParts[0]
    const args = cmdParts.slice(1)
    
    let output = ''
    let success = true
    let exitCode = 0
    let newCwd = session.cwd

    // Helper function to resolve paths
    const resolvePath = (relativePath: string) => {
      if (relativePath.startsWith('/')) {
        return relativePath
      }
      // Handle . and ..
      if (relativePath === '.') {
        return session.cwd
      }
      if (relativePath === '..') {
        const parts = session.cwd.split('/').filter(Boolean)
        parts.pop()
        return '/' + parts.join('/') || '/'
      }
      return session.cwd.endsWith('/') 
        ? `${session.cwd}${relativePath}`
        : `${session.cwd}/${relativePath}`
    }

    // Helper function to check if path exists
    const pathExists = (path: string) => {
      // Check if it's a file
      if (simulatedFS.has(path)) {
        return 'file'
      }
      // Check if it's a directory
      if (simulatedDirs.has(path)) {
        return 'dir'
      }
      // Check if any file starts with this path (for nested files)
      for (const filePath of Array.from(simulatedFS.keys())) {
        if (filePath.startsWith(path + '/')) {
          return 'dir'
        }
      }
      return null
    }

    switch (baseCmd) {
      case 'clear':
        return NextResponse.json({ 
          success: true, 
          output: '', 
          clear: true, 
          exitCode: 0,
          sessionId: sessionId || `session_${Date.now()}`
        })
      
      case 'help':
        output = `Available commands:
ls, pwd, cat, echo, mkdir, touch, rm, cd, clear, help
npm, node, git (simulated)

File operations work with simulated filesystem.
Use 'ls' to see available files.`
        break
      
      case 'ls':
        const currentDir = session.cwd
        // Get files and directories in current directory
        const files: string[] = []
        const dirs: string[] = []
        
        // Check direct files in this directory
        for (const filePath of Array.from(simulatedFS.keys())) {
          if (filePath === currentDir) continue
          
          if (filePath.startsWith(currentDir + '/')) {
            const relativePath = filePath.replace(currentDir + '/', '')
            const firstPart = relativePath.split('/')[0]
            if (firstPart && !files.includes(firstPart) && !dirs.includes(firstPart)) {
              files.push(firstPart)
            }
          }
        }
        
        // Check direct directories
        for (const dirPath of Array.from(simulatedDirs)) {
          if (dirPath === currentDir) continue
          
          if (dirPath.startsWith(currentDir + '/')) {
            const relativePath = dirPath.replace(currentDir + '/', '')
            const firstPart = relativePath.split('/')[0]
            if (firstPart && !dirs.includes(firstPart) && !files.includes(firstPart)) {
              dirs.push(firstPart)
            }
          }
        }
        
        // Check for nested directories (not explicitly in simulatedDirs but containing files)
        for (const filePath of Array.from(simulatedFS.keys())) {
          if (filePath.startsWith(currentDir + '/')) {
            const pathAfterCurrent = filePath.replace(currentDir + '/', '')
            const parts = pathAfterCurrent.split('/')
            if (parts.length > 1) {
              const firstPart = parts[0]
              if (firstPart && !dirs.includes(firstPart) && !files.includes(firstPart)) {
                dirs.push(firstPart)
              }
            }
          }
        }
        
        // Format output
        const allItems = [
          ...dirs.map(dir => `${dir}/`),
          ...files
        ].sort()
        
        output = allItems.length > 0 ? allItems.join('  ') : 'No files found'
        break
      
      case 'pwd':
        output = session.cwd || '/workspace'
        break
      
      case 'cat':
        if (args.length === 0) {
          output = 'cat: missing file operand'
          success = false
          exitCode = 1
        } else {
          const filePath = resolvePath(args[0])
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
        if (args.length === 0) {
          output = ''
        } else {
          // Join args with spaces, but skip if any arg is a pipe or redirect
          const text = args.join(' ')
          if (text.includes('>')) {
            output = 'Echo with redirection not supported'
            success = false
            exitCode = 1
          } else {
            output = text
          }
        }
        break
      
      case 'touch':
        if (args.length === 0) {
          output = 'touch: missing file operand'
          success = false
          exitCode = 1
        } else {
          const filePath = resolvePath(args[0])
          // Ensure parent directory exists
          const parentDir = filePath.substring(0, filePath.lastIndexOf('/')) || '/'
          if (!pathExists(parentDir)) {
            output = `touch: cannot create file: No such directory`
            success = false
            exitCode = 1
          } else {
            simulatedFS.set(filePath, '')
            output = ''
          }
        }
        break
      
      case 'mkdir':
        if (args.length === 0) {
          output = 'mkdir: missing operand'
          success = false
          exitCode = 1
        } else {
          const dirPath = resolvePath(args[0])
          if (pathExists(dirPath)) {
            output = `mkdir: cannot create directory: File exists`
            success = false
            exitCode = 1
          } else {
            simulatedDirs.add(dirPath)
            output = ''
          }
        }
        break
      
      case 'rm':
        if (args.length === 0) {
          output = 'rm: missing operand'
          success = false
          exitCode = 1
        } else {
          const path = resolvePath(args[0])
          const type = pathExists(path)
          
          if (!type) {
            output = `rm: cannot remove '${args[0]}': No such file or directory`
            success = false
            exitCode = 1
          } else if (type === 'dir') {
            // Check if directory is empty
            let hasFiles = false
            for (const filePath of Array.from(simulatedFS.keys())) {
              if (filePath.startsWith(path + '/')) {
                hasFiles = true
                break
              }
            }
            
            if (hasFiles) {
              output = `rm: cannot remove '${args[0]}': Directory not empty`
              success = false
              exitCode = 1
            } else {
              simulatedDirs.delete(path)
              output = ''
            }
          } else {
            // It's a file
            simulatedFS.delete(path)
            output = ''
          }
        }
        break
      
      case 'cd':
        if (args.length === 0) {
          // Go to home directory
          newCwd = '/workspace'
        } else {
          const targetPath = resolvePath(args[0])
          const type = pathExists(targetPath)
          
          if (!type || type === 'file') {
            output = `cd: ${args[0]}: No such directory`
            success = false
            exitCode = 1
            newCwd = session.cwd // Don't change directory
          } else {
            newCwd = targetPath
            output = ''
          }
        }
        break
      
      case 'npm':
        if (args[0] === 'install' || args[0] === 'i') {
          output = 'npm install completed (simulated)\nAdded 0 packages in 0s'
        } else if (args[0] === 'run' && args[1] === 'dev') {
          output = 'Starting development server on http://localhost:3000 (simulated)\nCompiled successfully!'
        } else if (args[0] === 'start') {
          output = 'Starting production server (simulated)\nServer running on port 8080'
        } else if (args[0] === '--version') {
          output = '10.5.0 (simulated)'
        } else {
          output = `npm ${args.join(' ')} (simulated)\nCommand executed successfully`
        }
        break
      
      case 'node':
        if (args.length === 0) {
          output = 'Welcome to Node.js v18.0.0 (simulated)\nType ".exit" to exit\nType ".help" for more information'
        } else {
          const scriptPath = resolvePath(args[0])
          const content = simulatedFS.get(scriptPath)
          if (content) {
            output = `Running ${args[0]} (simulated)\n${content}\nProgram exited with code 0`
          } else {
            output = `node: cannot open ${args[0]}: No such file`
            success = false
            exitCode = 1
          }
        }
        break
      
      case 'git':
        if (args[0] === 'status') {
          output = 'On branch main\nnothing to commit, working tree clean (simulated)'
        } else if (args[0] === 'add') {
          const files = args.slice(1).join(' ')
          output = files 
            ? `Added ${files} to staging area (simulated)`
            : 'Nothing specified to add (simulated)'
        } else if (args[0] === 'commit') {
          const message = args.slice(1).join(' ').replace(/^-m\s*['"]?/, '').replace(/['"]?$/, '')
          output = `[main ${Math.random().toString(16).substr(2, 7)}] ${message || "Update"} (simulated)\n 1 file changed, 0 insertions(+), 0 deletions(-)`
        } else if (args[0] === 'clone') {
          output = 'Cloning into repository... (simulated)\nremote: Enumerating objects: 100, done.'
        } else if (args[0] === 'pull') {
          output = 'Already up to date. (simulated)'
        } else if (args[0] === 'push') {
          output = 'Everything up-to-date (simulated)'
        } else if (args[0] === '--version') {
          output = 'git version 2.40.0 (simulated)'
        } else {
          output = `git ${args.join(' ')} (simulated)\nCommand executed successfully`
        }
        break
      
      case 'whoami':
        output = 'developer'
        break
      
      case 'date':
        output = new Date().toLocaleString()
        break
      
      case 'uname':
        output = 'Linux'
        break
      
      case 'which':
        if (args.length === 0) {
          output = 'which: missing command name'
          success = false
          exitCode = 1
        } else {
          const commands = ['ls', 'pwd', 'cat', 'echo', 'mkdir', 'touch', 'rm', 'cd', 'clear', 'help', 'npm', 'node', 'git', 'whoami', 'date', 'uname', 'which']
          if (commands.includes(args[0])) {
            output = `/usr/bin/${args[0]}`
          } else {
            output = `which: no ${args[0]} in (/usr/bin:/bin)`
            success = false
            exitCode = 1
          }
        }
        break
      
      default:
        output = `bash: ${baseCmd}: command not found\nTry 'help' for a list of available commands.`
        success = false
        exitCode = 127
    }

    // Update session with new working directory if it changed
    if (newCwd !== session.cwd) {
      session.cwd = newCwd
      if (sessionId) {
        terminalSessions.set(sessionId, session)
      }
    }

    // Sanitize all output to prevent XSS
    const sanitizedOutput = output
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')

    return NextResponse.json({
      success,
      output: sanitizedOutput,
      exitCode,
      cwd: session.cwd,
      executionTime: Math.floor(Math.random() * 50) + 20, // Simulate execution time
      sessionId: sessionId || `session_${Date.now()}`
    })

  } catch (error: any) {
    console.error('Terminal API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      output: 'An unexpected error occurred',
      exitCode: 1
    }, { status: 500 })
  }
}