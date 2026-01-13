'use client'

import { useIDEStore } from '@/stores/ide-store'
import { collaborationService } from '@/lib/collaboration-service'
import { useState, useEffect, useRef } from 'react'

export default function TopBar() {
  const { 
    collab, 
    setCollab, 
    environment, 
    setEnvironment,
    activeTab,
    tabs,
    updateTabContent,
    isRunning,
    runCurrentFile,
    previewOpen,
    setPreviewOpen,
    previewMode,
    setPreviewMode,
    previewUrl,
    setPreviewUrl
  } = useIDEStore()
  
  const [collaborationUsers, setCollaborationUsers] = useState<any[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [isStartingPreview, setIsStartingPreview] = useState(false)
  const [showRunDropdown, setShowRunDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize collaboration service
    const generateToken = async () => {
      // Get user's public IP for identification
      let userIP = 'unknown'
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipResponse.json()
        userIP = ipData.ip
      } catch (error) {
        console.warn('Could not fetch IP:', error)
        userIP = 'user-' + Math.random().toString(36).substr(2, 9)
      }
      
      const payload = {
        userId: userIP,
        name: userIP,
        avatar: `https://api.dicebear.com/9.x/glass/svg?seed=${userIP}`
      }
      return btoa(JSON.stringify(payload))
    }
    
    generateToken().then(token => {
      console.log('🔑 Generated token for IP-based user')
      collaborationService.connect(token)
    })

    // Set up event listeners
    collaborationService.on('connected', () => {
      console.log('Connected to collaboration service')
      setConnectionStatus('connected')
    })

    collaborationService.on('disconnected', (data: any) => {
      console.log('Disconnected from collaboration service:', data)
      setConnectionStatus('disconnected')
      setCollaborationUsers([])
    })

    collaborationService.on('error', (error: any) => {
      console.error('Collaboration service error:', error)
      setConnectionStatus('error')
    })

    collaborationService.on('user-joined', (data: any) => {
      setCollaborationUsers(prev => [...prev, data])
    })

    collaborationService.on('user-left', (data: any) => {
      setCollaborationUsers(prev => prev.filter(user => user.userId !== data.userId))
    })

    collaborationService.on('document-joined', (data: any) => {
      console.log('📄 Document joined:', data)
      if (data.users) {
        setCollaborationUsers(data.users)
      }
    })

    return () => {
      collaborationService.disconnect()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRunDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])



  const toggleCollaboration = async () => {
    console.log('🔄 toggleCollaboration called, activeTab:', activeTab, 'collab:', collab)
    
    if (!activeTab) {
      console.warn('No active tab for collaboration')
      return
    }

    setIsConnecting(true)
    const newMode = collab ? 'solo' : 'live'
    
    console.log(`🔄 Toggling to ${newMode} mode for tab:`, activeTab)
    
    try {
      // Join document in the new mode - use a FIXED shared document ID for all users
      const sharedDocumentId = 'shared-document' // Fixed ID so all users join the same document
      console.log('🎯 About to call joinDocument with:', sharedDocumentId, newMode)
      
      const result = collaborationService.joinDocument(sharedDocumentId, newMode)
      console.log('📋 joinDocument result:', result)
      
      setCollab(!collab)
      
      if (newMode === 'solo') {
        setCollaborationUsers([])
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Failed to toggle collaboration:', error)
      setConnectionStatus('error')
    } finally {
      setIsConnecting(false)
    }
  }

  const startLivePreview = async () => {
    setIsStartingPreview(true)
    
    try {
      const files: Record<string, string> = {}
      tabs.forEach(tab => {
        files[tab.name] = tab.content
      })
      
      const response = await fetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start server')
      }
      
      const result = await response.json()
      setPreviewUrl(result.url)
      setPreviewOpen(true)
      
    } catch (err) {
      console.error('Live preview error:', err)
    } finally {
      setIsStartingPreview(false)
    }
  }

  const handleRunAction = async () => {
    const currentTab = tabs.find(tab => tab.id === activeTab)
    if (!currentTab) return

    // If it's an HTML file or has HTML content, start preview
    if (currentTab.name.endsWith('.html') || 
        currentTab.content.includes('<!DOCTYPE html>') || 
        currentTab.content.includes('<html')) {
      await startLivePreview()
    } else {
      // For other files, run normally
      runCurrentFile()
    }
  }

  const currentTab = tabs.find(tab => tab.id === activeTab)

  return (
    <header className="h-12 border-b-line bg-black flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-white to-zinc-400"></div>
          <span className="font-bold text-white text-sm">KRIYA</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="label">Environment</span>
            <div className="flex bg-zinc-900 rounded-lg p-1">
              <button 
                onClick={() => setEnvironment('development')}
                className={`px-3 py-1 text-xs font-bold rounded transition ${
                  environment === 'development' 
                    ? 'bg-amber-600 text-white' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                DEV
              </button>
              <button 
                onClick={() => setEnvironment('production')}
                className={`px-3 py-1 text-xs font-bold rounded transition ${
                  environment === 'production' 
                    ? 'bg-red-600 text-white' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                PROD
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="label">Mode</span>
            <div className="flex bg-zinc-900 rounded-lg p-1">
              <button 
                onClick={toggleCollaboration}
                disabled={isConnecting || !activeTab}
                className={`px-3 py-1 text-xs font-bold rounded transition flex items-center gap-2 ${
                  !collab 
                    ? 'bg-blue-600 text-white' 
                    : 'text-zinc-400 hover:text-white'
                } ${isConnecting ? 'opacity-50' : ''}`}
              >
                {isConnecting && !collab ? (
                  <i className="ph ph-spinner animate-spin text-xs"></i>
                ) : (
                  <i className="ph ph-user text-xs"></i>
                )}
                SOLO
              </button>
              <button 
                onClick={toggleCollaboration}
                disabled={isConnecting || !activeTab}
                className={`px-3 py-1 text-xs font-bold rounded transition flex items-center gap-2 ${
                  collab 
                    ? 'bg-green-600 text-white' 
                    : 'text-zinc-400 hover:text-white'
                } ${isConnecting ? 'opacity-50' : ''}`}
              >
                {isConnecting && collab ? (
                  <i className="ph ph-spinner animate-spin text-xs"></i>
                ) : (
                  <i className="ph ph-users text-xs"></i>
                )}
                LIVE
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Live collaboration indicators */}
        {collab && (
          <div className="flex items-center gap-2">
            <span className="label">Live Session</span>
            <div className="flex -space-x-2">
              {/* Current user */}
              <div
                className="w-6 h-6 rounded-full border-2 border-green-500 bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white"
                title="You (Current Session)"
              >
                •
              </div>
              {/* Other collaborators */}
              {collaborationUsers.slice(0, 3).map((user, index) => (
                <div
                  key={`${user.id}-${index}`}
                  className="w-6 h-6 rounded-full border-2 border-black bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-xs font-bold text-white"
                  title={`Collaborator: ${user.name}`}
                  style={{ zIndex: collaborationUsers.length - index }}
                >
                  {user.name.split('.').pop()?.slice(-1) || 'U'}
                </div>
              ))}
              {collaborationUsers.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-black bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                  +{collaborationUsers.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
            connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            connectionStatus === 'error' ? 'bg-red-400' :
            'bg-zinc-600'
          }`}></div>
          <span className="text-xs text-zinc-400">
            {connectionStatus === 'connected' && collab ? `Live (${collaborationUsers.length + 1} users)` :
             connectionStatus === 'connecting' ? 'Connecting...' :
             connectionStatus === 'error' ? 'Connection Error' :
             collab ? 'Disconnected' : 'Solo'}
          </span>
        </div>

        {/* Current file info */}
        {currentTab && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <i className={currentTab.icon}></i>
            <span>{currentTab.name}</span>
            {currentTab.isDirty && (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* RUN BUTTON WITH DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex bg-white rounded overflow-hidden">
              <button 
                onClick={runCurrentFile}
                className="px-3 py-1 text-black font-bold text-xs hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <i className={`ph ${isRunning ? 'ph-spinner animate-spin' : 'ph-play'} text-xs`}></i>
                {isRunning ? 'RUNNING' : 'RUN'}
              </button>
              <button 
                onClick={() => setShowRunDropdown(!showRunDropdown)}
                className="px-2 py-1 text-black hover:bg-gray-100 border-l border-gray-300 transition-colors"
              >
                <i className="ph ph-caret-down text-xs"></i>
              </button>
            </div>
            
            {showRunDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-zinc-800 border border-zinc-600 rounded-lg shadow-2xl z-50 min-w-[160px] py-2">
                <button
                  onClick={() => { runCurrentFile(); setShowRunDropdown(false) }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <i className="ph ph-play text-green-400 text-xs"></i>
                  Run File
                </button>
                
                <button
                  onClick={() => { startLivePreview(); setShowRunDropdown(false) }}
                  disabled={isStartingPreview || tabs.length === 0}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <i className={`ph ${isStartingPreview ? 'ph-spinner animate-spin' : 'ph-monitor'} text-blue-400 text-xs`}></i>
                  Live Preview
                </button>
                
                <div className="h-px bg-zinc-600 my-2"></div>
                
                <button
                  onClick={() => { setPreviewOpen(!previewOpen); setShowRunDropdown(false) }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <i className={`ph ${previewOpen ? 'ph-eye-slash' : 'ph-eye'} text-purple-400 text-xs`}></i>
                  {previewOpen ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>
            )}
          </div>
          
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition">
            <i className="ph ph-bell text-zinc-400 hover:text-white"></i>
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition">
            <i className="ph ph-question text-zinc-400 hover:text-white"></i>
          </button>
        </div>
      </div>
    </header>
  )
}