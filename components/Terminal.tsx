'use client'

import { useState, useEffect, useRef } from 'react'
import { useIDEStore } from '@/stores/ide-store-new'

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
    cwd: '/workspace',
    shell: 'bash',
    pid: Math.floor(Math.random() * 10000) + 1000
  })

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commands])

  // Listen for code execution output
  useEffect(() => {
    const handleTerminalOutput = (event: CustomEvent) => {
      const { output, isError, filename, executionTime } = event.detail
      const commandId = Date.now().toString()
      
      const newCommand: TerminalCommand = {
        id: commandId,
        command: `run ${filename}`,
        output: output || '',
        timestamp: new Date(),
        status: isError ? 'error' : 'completed',
        duration: executionTime,
        exitCode: isError ? 1 : 0
      }
      
      setCommands(prev => [...prev, newCommand])
    }
    
    window.addEventListener('terminalOutput', handleTerminalOutput as EventListener)
    return () => window.removeEventListener('terminalOutput', handleTerminalOutput as EventListener)
  }, [])

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
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmd,
          cwd: systemInfo.cwd.replace('/workspace/', ''),
          sessionId: activeTerminalTab
        })
      })

      const result = await response.json()
      const duration = Date.now() - startTime

      if (result.clear) {
        setCommands([])
        setIsRunning(false)
        return
      }

      setCommands(prev => prev.map(c => 
        c.id === commandId 
          ? { 
              ...c, 
              output: result.output || result.error || '', 
              status: result.success ? 'completed' as const : 'error' as const, 
              duration, 
              exitCode: result.exitCode 
            }
          : c
      ))
    } catch (error) {
      const duration = Date.now() - startTime
      setCommands(prev => prev.map(c => 
        c.id === commandId 
          ? { ...c, output: 'Network error: Failed to execute command', status: 'error' as const, duration, exitCode: 1 }
          : c
      ))
    } finally {
      setIsRunning(false)
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
            <div>Real terminal with npm, git, and file operations</div>
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