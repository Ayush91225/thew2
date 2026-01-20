'use client'

import { useState } from 'react'
import { useIDEStore } from '@/stores/ide-store-new'

export default function StatusBar() {
  const { tabs, activeTab } = useIDEStore()
  const [liveServerRunning, setLiveServerRunning] = useState(false)
  const [serverPort, setServerPort] = useState(5500)

  const currentTab = tabs.find(tab => tab.id === activeTab)
  const isHtmlFile = currentTab?.language === 'html' || currentTab?.name.endsWith('.html')

  const toggleLiveServer = async () => {
    if (liveServerRunning) {
      // Stop server
      setLiveServerRunning(false)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: {
            type: 'info',
            title: 'Live Server Stopped',
            message: `Server stopped on port ${serverPort}`
          }
        }))
      }
    } else {
      // Start server
      setLiveServerRunning(true)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: {
            type: 'success',
            title: 'Live Server Started',
            message: `Server running on http://localhost:${serverPort}`
          }
        }))
        
        // Open preview in new tab
        if (currentTab) {
          const blob = new Blob([currentTab.content], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
        }
      }
    }
  }

  return (
    <div className="h-6 bg-black border-t border-zinc-800/50 flex items-center justify-between px-3 text-xs shrink-0">
      <div className="flex items-center gap-4">
        {/* Go Live Button */}
        <button
          onClick={toggleLiveServer}
          disabled={!isHtmlFile}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${
            liveServerRunning 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : isHtmlFile
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
          }`}
          title={isHtmlFile ? (liveServerRunning ? 'Stop Live Server' : 'Start Live Server') : 'Open an HTML file to use Live Server'}
        >
          <div className={`w-2 h-2 rounded-full ${
            liveServerRunning ? 'bg-white animate-pulse' : 'bg-zinc-500'
          }`}></div>
          <span className="font-medium text-[11px]">{liveServerRunning ? 'Port: ' + serverPort : 'Go Live'}</span>
        </button>

        {/* File Info */}
        {currentTab && (
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="text-[11px]">{currentTab.language.toUpperCase()}</span>
            <span>•</span>
            <span className="text-[11px]">UTF-8</span>
            <span>•</span>
            <span className="text-[11px]">LF</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-zinc-500">
        {/* Line/Column Info */}
        <span className="text-[11px]">Ln 1, Col 1</span>
        
        {/* Spaces */}
        <span className="text-[11px]">Spaces: 2</span>
        
        {/* Git Branch */}
        <div className="flex items-center gap-1">
          <i className="ph ph-git-branch text-xs"></i>
          <span className="text-[11px]">main</span>
        </div>
      </div>
    </div>
  )
}
