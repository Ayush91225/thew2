'use client'

import { useIDEStore } from '@/stores/ide-store'
import { collaborationService } from '@/lib/collaboration-service'
import { useState, useEffect } from 'react'

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
    runCurrentFile
  } = useIDEStore()
  
  const [collaborationUsers, setCollaborationUsers] = useState<any[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

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
          {/* RUN BUTTON */}
          <button 
            onClick={runCurrentFile}
            className="px-2 py-1 bg-white hover:bg-gray-100 text-black font-bold text-xs rounded transition-all duration-200 hover:scale-105"
            title="Run current file"
          >
            <i className={`ph ${isRunning ? 'ph-spinner animate-spin' : 'ph-play'} mr-1`}></i>
            {isRunning ? 'RUNNING' : 'RUN'}
          </button>
          
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