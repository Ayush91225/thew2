'use client'

import { useHotkeys } from 'react-hotkeys-hook'
import { useIDEStore } from '@/stores/ide-store-new'
import CommandPalette from '@/components/CommandPalette'
import AIAssistant from '@/components/AIAssistant'
import YamlEditor from '@/components/YamlEditor'
import Sidebar from '@/components/Sidebar'
import FileTabs from '@/components/FileTabs'
import CodeEditor from '@/components/CodeEditor'
import CollaborationManager from '@/components/CollaborationManager'
import CollaborationStatus from '@/components/CollaborationStatus'
import SettingsView from '@/components/SettingsView'
import SettingsModal from '@/components/SettingsModal'
import Toast from '@/components/Toast'
import { Sparkle, Terminal, Gear, FileText } from 'phosphor-react'

export default function IDELayout() {
  const { 
    activePanel,
    setActivePanel,
    setCommandPalette, 
    setAIModal,
    setYamlModal,
    setSettingsModal,
    view,
    isRunning,
    runCurrentFile,
    activeTab,
    tabs
  } = useIDEStore()

  // Global hotkeys
  useHotkeys('meta+b', (e) => {
    e.preventDefault()
    setActivePanel(activePanel ? '' : 'files')
  })

  useHotkeys('meta+shift+p', (e) => {
    e.preventDefault()
    setCommandPalette(true)
  })

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Top Bar */}
      <div className="h-8 border-b-line bg-black/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="text-xs font-bold">Kriya</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAIModal(true)}
            className="p-1 hover-item rounded text-zinc-500 hover:text-white"
            title="AI Assistant (⌘I)"
          >
            <Sparkle size={14} />
          </button>
          <button
            onClick={() => setYamlModal(true)}
            className="p-1 hover-item rounded text-zinc-500 hover:text-white"
            title="YAML Editor (⌘Y)"
          >
            <FileText size={14} />
          </button>
          
          {/* RUN BUTTON - HIGHLY VISIBLE */}
          <button
            onClick={runCurrentFile}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-black font-black text-xs uppercase tracking-wider rounded-md shadow-lg border-2 border-green-300"
            title="Run current file"
            style={{ 
              minWidth: '80px',
              fontSize: '11px',
              fontWeight: '900',
              zIndex: 9999,
              position: 'relative'
            }}
          >
            ▶ RUN
          </button>
          
          <button
            onClick={() => setSettingsModal(true)}
            className="p-1 hover-item rounded text-zinc-500 hover:text-white"
            title="Settings (⌘,)"
          >
            <Gear size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <Sidebar />
        
        {view === 'settings' ? (
          <SettingsView />
        ) : (
          <div className="flex-1 flex flex-col">
            <FileTabs />
            <CodeEditor />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 border-t-line bg-black/50 flex items-center justify-between px-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow"></div>
            <span className="text-zinc-500">Ready</span>
          </div>
          <CollaborationStatus />
          <span className="text-zinc-600">TypeScript</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-zinc-600">Ln 1, Col 1</span>
          <span className="text-zinc-600">UTF-8</span>
          <span className="text-zinc-600">LF</span>
        </div>
      </div>

      {/* Modals */}
      <CommandPalette />
      <AIAssistant />
      <YamlEditor />
      <SettingsModal />
      
      {/* Collaboration Manager */}
      <CollaborationManager />
      
      {/* Toast Notifications */}
      <Toast />
    </div>
  )
}