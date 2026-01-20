'use client'

import { useIDEStore } from '@/stores/ide-store-new'
import { collaborationService } from '@/lib/collaboration-service'
import { useState, useEffect, useRef } from 'react'
<<<<<<< HEAD
import KriyaLogo from './logo/KriyaLogo'

export default function TopBar() {
  const {
    collab,
    setCollab,
=======

export default function TopBar() {
  const { 
    collab, 
    setCollab, 
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
    activeTab,
    tabs,
    updateTabContent,
    isRunning,
    runCurrentFile,
    terminalOpen,
<<<<<<< HEAD
    setTerminalOpen,
    user,
    logout
  } = useIDEStore()

  const [collaborationUsers, setCollaborationUsers] = useState<any[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [teamContext, setTeamContext] = useState<any>(null)

  useEffect(() => {
    // Check for team context
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const teamId = params.get('team')
      
      if (teamId) {
        const storedTeam = localStorage.getItem('activeTeam')
        if (storedTeam) {
          setTeamContext(JSON.parse(storedTeam))
        }
      }
    }
  }, [])
=======
    setTerminalOpen
  } = useIDEStore()
  
  const [collaborationUsers, setCollaborationUsers] = useState<any[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a

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
<<<<<<< HEAD

=======
      
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
      const payload = {
        userId: userIP,
        name: userIP,
        avatar: `https://api.dicebear.com/9.x/glass/svg?seed=${userIP}`
      }
      return btoa(JSON.stringify(payload))
    }
<<<<<<< HEAD

=======
    
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
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
<<<<<<< HEAD

=======
    
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
    if (!activeTab) {
      console.warn('No active tab for collaboration')
      return
    }

    setIsConnecting(true)
    const newMode = collab ? 'solo' : 'live'
<<<<<<< HEAD

    console.log(`🔄 Toggling to ${newMode} mode for tab:`, activeTab)

=======
    
    console.log(`🔄 Toggling to ${newMode} mode for tab:`, activeTab)
    
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
    try {
      // Join document in the new mode - use a FIXED shared document ID for all users
      const sharedDocumentId = 'shared-document' // Fixed ID so all users join the same document
      console.log('🎯 About to call joinDocument with:', sharedDocumentId, newMode)
<<<<<<< HEAD

      const result = collaborationService.joinDocument(sharedDocumentId, newMode)
      console.log('📋 joinDocument result:', result)

      setCollab(!collab)

=======
      
      const result = collaborationService.joinDocument(sharedDocumentId, newMode)
      console.log('📋 joinDocument result:', result)
      
      setCollab(!collab)
      
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
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
<<<<<<< HEAD
          <KriyaLogo className="w-8 h-8" />
          <span className="font-bold text-white text-sm">KRIYA</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Team Work Status */}
          {teamContext && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg">
              <i className="ph ph-users text-blue-400"></i>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-blue-100">{teamContext.name}</span>
                <span className="text-[10px] text-blue-300">
                  {collab ? 'Live Collaboration Active' : 'Solo Mode'} • {teamContext.members?.length || 0} members
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="label">Mode</span>
            <div className="flex bg-zinc-900 rounded-lg p-1">
              <button
                onClick={toggleCollaboration}
                disabled={isConnecting || !activeTab}
                className={`px-3 py-1 text-xs font-bold rounded transition flex items-center gap-2 ${!collab
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white'
                  } ${isConnecting ? 'opacity-50' : ''}`}
=======
          <div className="w-6 h-6 rounded bg-gradient-to-br from-white to-zinc-400"></div>
          <span className="font-bold text-white text-sm">KRIYA</span>
        </div>
        
        <div className="flex items-center gap-4">
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
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
              >
                {isConnecting && !collab ? (
                  <i className="ph ph-spinner animate-spin text-xs"></i>
                ) : (
                  <i className="ph ph-user text-xs"></i>
                )}
                SOLO
              </button>
<<<<<<< HEAD
              <button
                onClick={toggleCollaboration}
                disabled={isConnecting || !activeTab}
                className={`px-3 py-1 text-xs font-bold rounded transition flex items-center gap-2 ${collab
                  ? 'bg-green-600 text-white'
                  : 'text-zinc-400 hover:text-white'
                  } ${isConnecting ? 'opacity-50' : ''}`}
=======
              <button 
                onClick={toggleCollaboration}
                disabled={isConnecting || !activeTab}
                className={`px-3 py-1 text-xs font-bold rounded transition flex items-center gap-2 ${
                  collab 
                    ? 'bg-green-600 text-white' 
                    : 'text-zinc-400 hover:text-white'
                } ${isConnecting ? 'opacity-50' : ''}`}
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
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
<<<<<<< HEAD
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
            connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              connectionStatus === 'error' ? 'bg-red-400' :
                'bg-zinc-600'
            }`}></div>
          <span className="text-xs text-zinc-400">
            {connectionStatus === 'connected' && collab ? `Live (${collaborationUsers.length + 1} users)` :
              connectionStatus === 'connecting' ? 'Connecting...' :
                connectionStatus === 'error' ? 'Connection Error' :
                  collab ? 'Disconnected' : 'Solo'}
=======
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
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
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
<<<<<<< HEAD
          {/* ADMIN DASHBOARD BUTTON */}
          <a
            href="/admin"
            target="_blank"
            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition group"
            title="Admin Dashboard"
          >
            <i className="ph ph-gauge text-zinc-400 group-hover:text-white"></i>
          </a>

          {/* TERMINAL BUTTON */}
          <button
            onClick={() => setTerminalOpen(!terminalOpen)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${terminalOpen
              ? 'bg-white/10 text-white'
              : 'hover:bg-white/5 text-zinc-400 hover:text-white'
              }`}
=======
          {/* TERMINAL BUTTON */}
          <button 
            onClick={() => setTerminalOpen(!terminalOpen)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
              terminalOpen 
                ? 'bg-white/10 text-white' 
                : 'hover:bg-white/5 text-zinc-400 hover:text-white'
            }`}
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
            title="Terminal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM4 5V19H20V5H4ZM12 15H18V17H12V15ZM8.66685 12L5.83842 9.17157L7.25264 7.75736L11.4953 12L7.25264 16.2426L5.83842 14.8284L8.66685 12Z"></path>
            </svg>
          </button>
<<<<<<< HEAD

          {/* RUN BUTTON */}
          <button
=======
          
          {/* RUN BUTTON */}
          <button 
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
            onClick={runCurrentFile}
            disabled={!activeTab || isRunning}
            className="px-4 py-1.5 bg-white text-black font-bold text-xs hover:bg-gray-100 transition-colors flex items-center gap-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className={`ph ${isRunning ? 'ph-spinner animate-spin' : 'ph-play'} text-xs`}></i>
            {isRunning ? 'RUNNING' : 'RUN'}
          </button>
<<<<<<< HEAD
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-white">{user.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">{user.role}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>

              <button
                onClick={() => {
                  logout()
                  window.location.href = '/login'
                }}
                className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition group ml-2"
                title="Logout"
              >
                <i className="ph ph-sign-out text-zinc-400 group-hover:text-red-400"></i>
              </button>
            </div>
          )}
=======
          
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition">
            <i className="ph ph-bell text-zinc-400 hover:text-white"></i>
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition">
            <i className="ph ph-question text-zinc-400 hover:text-white"></i>
          </button>
>>>>>>> b9b08b1f72adc3e2c782bb8e94fd06833fd0461a
        </div>
      </div>
    </header>
  )
}