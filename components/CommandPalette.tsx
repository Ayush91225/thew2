'use client'

import { useIDEStore } from '@/stores/ide-store-new'
import { useHotkeys } from 'react-hotkeys-hook'
import { useEffect, useState } from 'react'

interface Command {
  id: number
  icon: string
  label: string
  desc: string
  key: string
  category: string
  action?: 'terminal' | 'search' | 'settings' | 'ai' | 'deploy'
}

const commands: Command[] = [
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
    setAIChatOpen,
    loadFromURL,
    setView,
    terminalOpen
  } = useIDEStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Toggle command palette with Ctrl+K or Cmd+K
  useHotkeys('ctrl+k, meta+k', (e) => {
    e.preventDefault()
    setCommandPalette(!commandPalette)
    setSearchQuery('')
    setSelectedIndex(0)
  }, {
    enabled: true,
    preventDefault: true,
  }, [commandPalette])

  // Close with Escape
  useHotkeys('escape', () => {
    if (commandPalette) {
      setCommandPalette(false)
      setSearchQuery('')
    }
  }, { 
    enabled: commandPalette,
    preventDefault: true 
  }, [commandPalette])

  // Toggle terminal with Ctrl+`
  useHotkeys('ctrl+`', (e) => {
    e.preventDefault()
    setTerminalOpen(!terminalOpen)
    if (commandPalette) {
      setCommandPalette(false)
    }
  }, {
    enabled: true,
    preventDefault: true,
  }, [terminalOpen, commandPalette])

  // Format document with Shift+Alt+F
  useHotkeys('shift+alt+f', async (e) => {
    e.preventDefault()
    console.log('Format document triggered')
  }, {
    enabled: true,
    preventDefault: true,
  }, [])

  // Navigate with arrow keys
  useHotkeys('up, down', (e) => {
    if (!commandPalette) return
    
    e.preventDefault()
    const filteredCommands = getFilteredCommands()
    if (filteredCommands.length === 0) return
    
    const direction = e.key === 'ArrowUp' ? -1 : 1
    const newIndex = (selectedIndex + direction + filteredCommands.length) % filteredCommands.length
    setSelectedIndex(newIndex)
  }, {
    enabled: commandPalette,
    preventDefault: true,
  }, [commandPalette, selectedIndex, searchQuery])

  // Execute with Enter
  useHotkeys('enter', (e) => {
    if (!commandPalette) return
    
    e.preventDefault()
    const filteredCommands = getFilteredCommands()
    if (filteredCommands.length > 0 && selectedIndex < filteredCommands.length) {
      executeCommand(filteredCommands[selectedIndex].id)
    }
  }, {
    enabled: commandPalette,
    preventDefault: true,
  }, [commandPalette, selectedIndex, searchQuery])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadFromURL()
    }
  }, [loadFromURL])

  useEffect(() => {
    // Reset selection when search changes
    setSelectedIndex(0)
  }, [searchQuery])

  const getFilteredCommands = () => {
    return commands.filter(cmd => 
      searchQuery === '' || 
      cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const executeCommand = (commandId: number) => {
    const command = commands.find(cmd => cmd.id === commandId)
    if (!command) return

    if (!command.action) {
      setCommandPalette(false)
      setSearchQuery('')
      return
    }

    switch (command.action) {
      case 'ai':
        setAIChatOpen(true)
        setAIModal(true)
        break
      case 'settings':
        setView('settings')
        break
      case 'deploy':
        setView('deploy')
        break
      case 'search':
        setGlobalSearch(true)
        break
      case 'terminal':
        setTerminalOpen(!terminalOpen)
        break
    }
    setCommandPalette(false)
    setSearchQuery('')
  }

  const filteredCommands = getFilteredCommands()
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

  if (!commandPalette) return null

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-black/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setCommandPalette(false)
          setSearchQuery('')
        }
      }}
    >
      <div className="w-full max-w-2xl glass border-line rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-6 py-4 gap-4 border-b-line">
          <i className="ph ph-magnifying-glass text-white text-lg"></i>
          <input 
            type="text" 
            placeholder="Search commands, files, actions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setCommandPalette(false)
                setSearchQuery('')
              }
            }}
          />
          <button 
            onClick={() => {
              setCommandPalette(false)
              setSearchQuery('')
            }}
            className="text-zinc-400 hover:text-white transition p-1"
            aria-label="Close"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <i className="ph ph-magnifying-glass text-3xl text-zinc-600 mb-3"></i>
              <p className="text-sm text-zinc-400">No commands found</p>
              <p className="text-xs text-zinc-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-6 py-2 bg-black/20 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map((cmd, cmdIndex) => {
                  const flatIndex = filteredCommands.findIndex(fc => fc.id === cmd.id)
                  const isSelected = flatIndex === selectedIndex
                  
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => executeCommand(cmd.id)}
                      className={`flex items-center justify-between px-6 py-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-white/5' : 'hover:bg-white/5'
                      }`}
                      onMouseEnter={() => {
                        const flatIndex = filteredCommands.findIndex(fc => fc.id === cmd.id)
                        setSelectedIndex(flatIndex)
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <i className={`${cmd.icon} text-lg ${isSelected ? 'text-white' : 'text-zinc-300'}`} />
                        <div>
                          <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                            {cmd.label}
                          </div>
                          <div className="text-xs text-zinc-500">{cmd.desc}</div>
                        </div>
                      </div>
                      {cmd.key && (
                        <kbd className={`px-2 py-1 text-xs font-mono ${
                          isSelected ? 'text-zinc-800 bg-white/90' : 'text-zinc-400 bg-white/10'
                        } rounded`}>
                          {cmd.key}
                        </kbd>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
        
        {/* Footer with quick tips */}
        <div className="px-6 py-3 border-t-line bg-black/30 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↵</kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">esc</kbd>
              <span>Close</span>
            </span>
          </div>
          <div className="text-zinc-400">
            {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}