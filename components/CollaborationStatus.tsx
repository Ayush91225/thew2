'use client'

import { useEffect, useState } from 'react'
import { useIDEStore } from '@/stores/ide-store-new'
import { collaborationService } from '@/lib/collaboration-service'

export default function CollaborationStatus() {
  const { collab, isConnectedToCollaboration, collaborationUsers } = useIDEStore()
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

  useEffect(() => {
    const updateStatus = () => {
      const status = collaborationService.getConnectionStatus()
      if (status !== 'closing') {
        setConnectionStatus(status as 'disconnected' | 'connecting' | 'connected' | 'error')
      }
    }

    // Listen for connection status changes
    collaborationService.on('connecting', updateStatus)
    collaborationService.on('connected', updateStatus)
    collaborationService.on('disconnected', updateStatus)
    collaborationService.on('error', updateStatus)

    // Initial status
    updateStatus()

    return () => {
      collaborationService.off('connecting', updateStatus)
      collaborationService.off('connected', updateStatus)
      collaborationService.off('disconnected', updateStatus)
      collaborationService.off('error', updateStatus)
    }
  }, [])

  if (!collab) return null

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400'
      case 'connecting': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return 'ph-check-circle'
      case 'connecting': return 'ph-spinner animate-spin'
      case 'error': return 'ph-warning-circle'
      default: return 'ph-circle'
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 rounded-md border border-zinc-800">
      <i className={`${getStatusIcon()} ${getStatusColor()} text-sm`}></i>
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {connectionStatus === 'connected' ? 'Live' : 
         connectionStatus === 'connecting' ? 'Connecting...' :
         connectionStatus === 'error' ? 'Error' : 'Offline'}
      </span>
      {connectionStatus === 'connected' && collaborationUsers.length > 0 && (
        <div className="flex items-center gap-1 ml-2">
          <div className="flex -space-x-1">
            {collaborationUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-white"
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {collaborationUsers.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[8px] font-bold text-zinc-300">
                +{collaborationUsers.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}