'use client'

import { useIDEStore } from '@/stores/ide-store'
import { useHotkeys } from 'react-hotkeys-hook'
import { useEffect, useState } from 'react'

const commands = [
  { id: 1, icon: 'ph ph-terminal-window', label: 'Toggle Terminal', desc: 'Open/close integrated terminal', key: '⌃`', category: 'General', action: 'terminal' },
  { id: 2, icon: 'ph ph-search', label: 'Global Search', desc: 'Search across project files', key: '⌘⇧F', category: 'General', action: 'search' },
  { id: 3, icon: 'ph ph-gear-six', label: 'Settings', desc: 'Open settings menu', key: '⌘,', category: 'General', action: 'settings' },
  { id: 4, icon: 'ph ph-sparkle', label: 'AI Assistant', desc: 'Open AI code assistant', key: '⌘I', category: 'General', action: 'ai' },
  { id: 5, icon: 'ph ph-file', label: 'New File', desc: 'Create a new file', key: '⌘N', category: 'Editor' },
  { id: 6, icon: 'ph ph-floppy-disk', label: 'Save File', desc: 'Save current file', key: '⌘S', category: 'Editor' },
  { id: 7, icon: 'ph ph-x', label: 'Close Tab', desc: 'Close current tab', key: '⌘W', category: 'Editor' },
  { id: 8, icon: 'ph ph-arrows-clockwise', label: 'Format Document', desc: 'Format current file', key: '⇧⌥F', category: 'Editor' },
  { id: 9, icon: 'ph ph-chat-slash', label: 'Toggle Comment', desc: 'Comment/uncomment line', key: '⌘/', category: 'Editor' },
  { id: 10, icon: 'ph ph-magnifying-glass', label: 'Find in File', desc: 'Search in current file', key: '⌘F', category: 'Editor' },
  { id: 11, icon: 'ph ph-sidebar', label: 'Toggle Sidebar', desc: 'Show/hide sidebar', key: '⌘B', category: 'View' },
  { id: 12, icon: 'ph ph-rocket-launch', label: 'Deploy', desc: 'Deploy to production', key: '⌘⇧D', category: 'Cloud', action: 'deploy' },
  { id: 13, icon: 'ph ph-bug', label: 'Start Debug', desc: 'Start debugging session', key: 'F5', category: 'Debug' },
  { id: 14, icon: 'ph ph-circle', label: 'Toggle Breakpoint', desc: 'Toggle debug breakpoint', key: 'F9', category: 'Debug' },
]

export default function CommandPalette() {
  const { 
    commandPalette, 
    setCommandPalette, 
    setAIModal, 
    setSettingsModal, 
    setGlobalSearch,
    setTerminalOpen,
    setView,
    loadFromURL
  } = useIDEStore()

  const [searchQuery, setSearchQuery] = useState('')

  useHotkeys('meta+k', (e) => {
    e.preventDefault()
    setCommandPalette(!commandPalette)
  })

  useHotkeys('escape', () => {
    if (commandPalette) setCommandPalette(false)
  })

  useHotkeys('ctrl+`', (e) => {
    e.preventDefault()
    const { terminalOpen, setTerminalOpen } = useIDEStore.getState()
    setTerminalOpen(!terminalOpen)
  })

  useEffect(() => {
    loadFromURL()
  }, [loadFromURL])

  const executeCommand = (commandId: number) => {
    const command = commands.find(cmd => cmd.id === commandId)
    if (!command?.action) {
      console.log('Command executed:', commandId)
      setCommandPalette(false)
      return
    }

    switch (command.action) {
      case 'ai':
        const { setAIChatOpen } = useIDEStore.getState()
        setAIChatOpen(true)
        break
      case 'settings':
        setView('settings')
        break
      case 'search':
        setGlobalSearch(true)
        break
      case 'terminal':
        const { terminalOpen } = useIDEStore.getState()
        setTerminalOpen(!terminalOpen)
        break
      case 'deploy':
        setView('deploy')
        break
      case 'openProject':
        // This would trigger the file system API
        console.log('Opening project folder...')
        break
      default:
        console.log('Command executed:', commandId)
    }
    setCommandPalette(false)
  }

  const filteredCommands = commands.filter(cmd => 
    searchQuery === '' || 
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, typeof commands>)

  if (!commandPalette) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl glass border-line rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-6 py-4 gap-4 border-b-line">
          <i className="ph ph-terminal-window text-white text-lg"></i>
          <input 
            type="text" 
            placeholder="Search commands, files, actions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-white"
            autoFocus
          />
          <button 
            onClick={() => setCommandPalette(false)}
            className="text-zinc-600 hover:text-white transition"
          >
            <i className="ph ph-x"></i>
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="label px-6 py-3 bg-black/40">{category}</div>
              {cmds.map((cmd) => (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd.id)}
                  className="hover-item flex items-center justify-between px-6 py-3 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <i className={`${cmd.icon} text-lg text-white`} />
                    <div>
                      <div className="text-sm font-semibold text-white">{cmd.label}</div>
                      <div className="text-xs text-zinc-600">{cmd.desc}</div>
                    </div>
                  </div>
                  {cmd.key && (
                    <kbd className="px-2 py-1 text-[9px] font-bold text-zinc-600 bg-white/5 rounded">
                      {cmd.key}
                    </kbd>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}