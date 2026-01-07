'use client'

import { useState, useEffect, useRef } from 'react'
import { useIDEStore } from '@/stores/ide-store'

interface TerminalCommand {
  id: string
  command: string
  output: string
  timestamp: Date
  status: 'running' | 'completed' | 'error'
  duration?: number
  exitCode?: number
}

interface SystemInfo {
  user: string
  hostname: string
  cwd: string
  shell: string
  pid: number
}

export default function Terminal() {
  const { 
    terminalOpen, 
    setTerminalOpen, 
    terminalTabs, 
    activeTerminalTab, 
    addTerminalTab, 
    closeTerminalTab, 
    setActiveTerminalTab 
  } = useIDEStore()
  
  const [commands, setCommands] = useState<TerminalCommand[]>([])
  const [currentCommand, setCurrentCommand] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalRef = useRef<HTMLDivElement>(null)
  
  const [systemInfo] = useState<SystemInfo>({
    user: 'dev',
    hostname: 'kriya-ide',
    cwd: '/workspace/kriya-ide',
    shell: 'bash',
    pid: Math.floor(Math.random() * 10000) + 1000
  })

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commands])

  if (!terminalOpen) return null

  const activeTab = terminalTabs.find(tab => tab.id === activeTerminalTab)

  const addNewTerminal = () => {
    const newTab = {
      id: `terminal-${Date.now()}`,
      name: `${systemInfo.shell}`,
      type: 'bash' as const,
      isActive: true
    }
    addTerminalTab(newTab)
  }

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || isRunning) return

    const commandId = Date.now().toString()
    const startTime = Date.now()
    const newCommand: TerminalCommand = {
      id: commandId,
      command: cmd,
      output: '',
      timestamp: new Date(),
      status: 'running'
    }

    setCommands(prev => [...prev, newCommand])
    setCommandHistory(prev => [...prev, cmd])
    setCurrentCommand('')
    setHistoryIndex(-1)
    setIsRunning(true)

    try {
      const output = await simulateCommand(cmd)
      const duration = Date.now() - startTime
      setCommands(prev => prev.map(c => 
        c.id === commandId 
          ? { ...c, output, status: 'completed' as const, duration, exitCode: 0 }
          : c
      ))
    } catch (error) {
      const duration = Date.now() - startTime
      setCommands(prev => prev.map(c => 
        c.id === commandId 
          ? { ...c, output: `${systemInfo.shell}: ${cmd.split(' ')[0]}: command not found`, status: 'error' as const, duration, exitCode: 127 }
          : c
      ))
    } finally {
      setIsRunning(false)
    }
  }

  const simulateCommand = async (cmd: string): Promise<string> => {
    const delay = 200 + Math.random() * 800
    await new Promise(resolve => setTimeout(resolve, delay))
    
    const [command, ...args] = cmd.trim().split(' ')

    switch (command.toLowerCase()) {
      case 'ls':
        const lsOutput = [
          'total 24',
          'drwxr-xr-x  12 dev  staff   384 Jan 20 14:32 .',
          'drwxr-xr-x   8 dev  staff   256 Jan 20 14:30 ..',
          '-rw-r--r--   1 dev  staff   123 Jan 20 14:32 .gitignore',
          '-rw-r--r--   1 dev  staff  1024 Jan 20 14:32 README.md',
          'drwxr-xr-x   5 dev  staff   160 Jan 20 14:32 app',
          'drwxr-xr-x   8 dev  staff   256 Jan 20 14:32 components',
          'drwxr-xr-x   3 dev  staff    96 Jan 20 14:32 lib',
          '-rw-r--r--   1 dev  staff   567 Jan 20 14:32 next.config.js',
          'drwxr-xr-x 234 dev  staff  7488 Jan 20 14:32 node_modules',
          '-rw-r--r--   1 dev  staff  2048 Jan 20 14:32 package.json',
          'drwxr-xr-x   4 dev  staff   128 Jan 20 14:32 stores',
          '-rw-r--r--   1 dev  staff   890 Jan 20 14:32 tsconfig.json'
        ]
        return args.includes('-la') ? lsOutput.join('\n') : 'README.md  app  components  lib  next.config.js  node_modules  package.json  stores  tsconfig.json'
      
      case 'pwd': 
        return systemInfo.cwd
      
      case 'whoami': 
        return systemInfo.user
      
      case 'ps':
        return `  PID TTY           TIME CMD\n${systemInfo.pid} ttys000    0:00.12 -${systemInfo.shell}\n${systemInfo.pid + 1} ttys000    0:00.01 node`
      
      case 'npm':
        if (args[0] === 'install') {
          return `npm WARN deprecated package@1.0.0\nnpm WARN deprecated another-package@2.0.0\n\nadded 1247 packages, and audited 1248 packages in 3s\n\n127 packages are looking for funding\n  run \`npm fund\` for details\n\nfound 0 vulnerabilities`
        }
        if (args[0] === 'run' && args[1] === 'dev') {
          return `> kriya-ide@0.1.0 dev\n> next dev\n\n   ▲ Next.js 14.0.4\n   - Local:        http://localhost:3000\n   - Environments: .env.local\n\n ✓ Ready in 2.1s`
        }
        if (args[0] === 'run' && args[1] === 'build') {
          return `> kriya-ide@0.1.0 build\n> next build\n\n   ▲ Next.js 14.0.4\n\n   Creating an optimized production build ...\n ✓ Compiled successfully\n ✓ Linting and checking validity of types\n ✓ Collecting page and build info\n ✓ Generating static pages (5/5)\n ✓ Collecting build traces\n ✓ Finalizing page optimization\n\nRoute (app)                              Size     First Load JS\n┌ ○ /                                    142 B          87.2 kB\n└ ○ /_not-found                         871 B          87.9 kB\n+ First Load JS shared by all            87.1 kB\n  ├ chunks/framework-aec844bf6d39c508.js   45.2 kB\n  ├ chunks/main-18b4b3c8b0b9b7c3.js        31.8 kB\n  ├ chunks/polyfills-c67a75d1b6f99dc8.js    5.17 kB\n  └ chunks/webpack-87b3b7c8b0b9b7c3.js      4.95 kB\n\n○  (Static)  automatically rendered as static HTML (uses no initial props)`
        }
        return `Usage: npm <command>\n\nwhere <command> is one of:\n    install, run, build, test, start`
      
      case 'git':
        if (args[0] === 'status') {
          return `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n\tmodified:   components/Terminal.tsx\n\tmodified:   stores/ide-store.ts\n\nno changes added to commit (use "git add" or "git commit -a")`
        }
        if (args[0] === 'log') {
          return `commit a1b2c3d4e5f6g7h8i9j0 (HEAD -> main, origin/main)\nAuthor: Developer <dev@kriya-ide.com>\nDate:   Sat Jan 20 14:32:15 2024 -0800\n\n    feat: enhance terminal with detailed output\n\ncommit b2c3d4e5f6g7h8i9j0a1\nAuthor: Developer <dev@kriya-ide.com>\nDate:   Sat Jan 20 12:15:30 2024 -0800\n\n    fix: improve settings panel UI`
        }
        return `usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]\n           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]\n           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]\n           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]\n           [--super-prefix=<path>] [--config-env=<name>=<envvar>]\n           <command> [<args>]`
      
      case 'clear':
        setCommands([])
        return ''
      
      case 'echo':
        return args.join(' ')
      
      case 'cat':
        if (args[0] === 'package.json') {
          return `{\n  "name": "kriya-ide",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start",\n    "lint": "next lint"\n  },\n  "dependencies": {\n    "next": "14.0.4",\n    "react": "^18",\n    "react-dom": "^18"\n  }\n}`
        }
        return `cat: ${args[0]}: No such file or directory`
      
      case 'live-server':
        return `🚀 Live Server started at http://localhost:3000\n📁 Serving files from: /workspace/kriya-ide\n🔄 Auto-reload enabled\n📱 CORS enabled\n\n[Live Server] Watching for file changes...\n[Live Server] Ready to serve your files!`
      
      case 'serve':
        if (args.includes('-s')) {
          return `🌐 Static file server started\n📍 Local:    http://localhost:5000\n📍 Network:  http://192.168.1.100:5000\n\n[Serve] Press Ctrl+C to stop`
        }
        return `serve - Static file serving and directory listing\n\nUSAGE:\n\n  serve [options] [path]\n\nOPTIONS:\n\n  -s, --single     Serve single page apps with fallback to index.html`
      
      case 'date':
        return new Date().toString()
      
      case 'uptime':
        return `14:32  up 2 days,  3:45, 2 users, load averages: 1.23 1.45 1.67`
      
      case 'df':
        return `Filesystem     1K-blocks      Used Available Use% Mounted on\n/dev/disk1s1   488245288 123456789 364788499  26% /\n/dev/disk1s5   488245288   2097152 364788499   1% /System/Volumes/VM\n/dev/disk1s3   488245288   1048576 364788499   1% /System/Volumes/Preboot`
      
      default:
        throw new Error(`Command not found: ${command}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCurrentCommand('')
        } else {
          setHistoryIndex(newIndex)
          setCurrentCommand(commandHistory[newIndex])
        }
      }
    }
  }

  const getPrompt = () => {
    const shortCwd = systemInfo.cwd.split('/').pop() || systemInfo.cwd
    return `${systemInfo.user}@${systemInfo.hostname}:${shortCwd}$`
  }

  return (
    <div className="relative bg-black flex flex-col" style={{ height: '320px' }}>
      {/* Resize Handle */}
      <div className="absolute top-0 left-0 right-0 h-1 cursor-row-resize bg-transparent hover:bg-zinc-600 transition-colors z-10" 
           onMouseDown={(e) => {
             e.preventDefault()
             const startY = e.clientY
             const element = e.currentTarget.parentElement as HTMLElement
             const startHeight = element?.offsetHeight || 320
             
             const handleMouseMove = (e: MouseEvent) => {
               const newHeight = Math.max(200, Math.min(600, startHeight - (e.clientY - startY)))
               if (element) {
                 element.style.height = `${newHeight}px`
               }
             }
             
             const handleMouseUp = () => {
               document.removeEventListener('mousemove', handleMouseMove)
               document.removeEventListener('mouseup', handleMouseUp)
             }
             
             document.addEventListener('mousemove', handleMouseMove)
             document.addEventListener('mouseup', handleMouseUp)
           }}
      ></div>

      {/* Terminal Header */}
      <div className="h-8 border-b-line flex items-center shrink-0 bg-zinc-950">
        <div className="flex items-center flex-1 overflow-x-auto scrollbar-thin">
          {terminalTabs.map((tab) => (
            <div 
              key={tab.id}
              onClick={() => setActiveTerminalTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1 text-xs cursor-pointer transition border-r border-zinc-800 whitespace-nowrap ${
                activeTerminalTab === tab.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <i className="ph ph-terminal-window text-xs"></i>
              <span>{tab.name}</span>
              <span className="text-zinc-600 text-[10px]">#{tab.id.split('-')[1]?.slice(-3)}</span>
              {terminalTabs.length > 1 && (
                <i 
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTerminalTab(tab.id)
                  }}
                  className="ph ph-x text-[10px] hover:text-red-400 ml-1"
                ></i>
              )}
            </div>
          ))}
          <button 
            onClick={addNewTerminal}
            className="px-2 py-1 text-xs text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition flex items-center gap-1"
            title="New Terminal"
          >
            <i className="ph ph-plus text-[10px]"></i>
          </button>
        </div>
        <div className="flex items-center gap-2 px-3">
          <span className="text-[10px] text-zinc-500">PID: {systemInfo.pid}</span>
          <button 
            onClick={() => setTerminalOpen(false)}
            className="text-xs text-zinc-500 hover:text-white transition"
          >
            <i className="ph ph-x"></i>
          </button>
        </div>
      </div>
      
      {/* Terminal Content */}
      <div ref={terminalRef} className="flex-1 p-3 overflow-y-auto font-mono text-xs bg-black">
        {commands.length === 0 && (
          <div className="text-zinc-500 mb-3">
            <div>Kriya IDE Terminal v1.0.0</div>
            <div>Type &apos;help&apos; for available commands</div>
            <div></div>
          </div>
        )}
        
        {commands.map((cmd) => (
          <div key={cmd.id} className="mb-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400">{getPrompt()}</span>
              <span className="text-white">{cmd.command}</span>
              {cmd.status === 'running' && (
                <i className="ph ph-spinner animate-spin text-blue-400 text-[10px]"></i>
              )}
              {cmd.duration && cmd.status === 'completed' && (
                <span className="text-zinc-600 text-[10px] ml-auto">[{cmd.duration}ms]</span>
              )}
            </div>
            {cmd.output && (
              <div className={`mt-1 whitespace-pre-wrap ${
                cmd.status === 'error' ? 'text-red-400' : 'text-zinc-300'
              }`}>
                {cmd.output}
              </div>
            )}
          </div>
        ))}
        
        <div className="flex items-center gap-2">
          <span className="text-green-400">{getPrompt()}</span>
          <input
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            className="flex-1 bg-transparent outline-none text-white placeholder-zinc-600"
            placeholder={isRunning ? "Running..." : ""}
            autoFocus
          />
          {isRunning && (
            <i className="ph ph-spinner animate-spin text-blue-400 text-[10px]"></i>
          )}
        </div>
      </div>
    </div>
  )
}