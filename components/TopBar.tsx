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
    updateTabContent
  } = useIDEStore()
  
  const [collaborationUsers, setCollaborationUsers] = useState<any[]>([])
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Initialize collaboration service
    const generateToken = () => {
      // Simple JWT-like token for demo
      const payload = {
        userId: 'demo-user-' + Math.random().toString(36).substr(2, 9),
        name: 'Demo User',
        avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=demo'
      }
      return btoa(JSON.stringify(payload)) // Simple base64 encoding for demo
    }
    
    const token = generateToken()
    console.log('🔑 Generated demo token:', token)
    collaborationService.connect(token)

    // Set up event listeners
    collaborationService.on('connected', () => {
      console.log('Connected to collaboration service')
    })

    collaborationService.on('user-joined', (data: any) => {
      setCollaborationUsers(prev => [...prev, data])
    })

    collaborationService.on('user-left', (data: any) => {
      setCollaborationUsers(prev => prev.filter(user => user.userId !== data.userId))
    })

    collaborationService.on('document-joined', (data: any) => {
      if (data.users) {
        setCollaborationUsers(data.users)
      }
    })

    return () => {
      collaborationService.disconnect()
    }
  }, [])

  const toggleCollaboration = async () => {
    if (!activeTab) return

    setIsConnecting(true)
    const newMode = collab ? 'solo' : 'live'
    
    try {
      // Join document in the new mode
      collaborationService.joinDocument(activeTab, newMode)
      setCollab(!collab)
      
      if (newMode === 'solo') {
        setCollaborationUsers([])
      }
    } catch (error) {
      console.error('Failed to toggle collaboration:', error)
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
        {collab && collaborationUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="label">Collaborators</span>
            <div className="flex -space-x-2">
              {collaborationUsers.slice(0, 3).map((user, index) => (
                <div
                  key={user.id}
                  className="w-6 h-6 rounded-full border-2 border-black bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-xs font-bold text-white"
                  title={user.name}
                  style={{ zIndex: collaborationUsers.length - index }}
                >
                  {user.name?.charAt(0) || 'U'}
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
            collab ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'
          }`}></div>
          <span className="text-xs text-zinc-400">
            {collab ? 'Live' : 'Solo'}
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