'use client'

import { useState, useEffect } from 'react'
import { collaborationService } from '@/lib/collaboration-service-real'

export default function BackendStatus() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [serverInfo, setServerInfo] = useState<{ url: string; connected: boolean; documentId: string | null } | null>(null)

  useEffect(() => {
    const updateStatus = () => {
      const connectionStatus = collaborationService.getConnectionStatus()
      const info = collaborationService.getServerInfo()
      setStatus(connectionStatus)
      setServerInfo(info)
    }

    // Initial status
    updateStatus()

    // Listen for connection events
    const handleConnected = () => {
      setStatus('connected')
      updateStatus()
    }

    const handleDisconnected = () => {
      setStatus('disconnected')
      updateStatus()
    }

    const handleError = () => {
      setStatus('error')
      updateStatus()
    }

    collaborationService.on('connected', handleConnected)
    collaborationService.on('disconnected', handleDisconnected)
    collaborationService.on('connection-error', handleError)

    // Periodic status update
    const interval = setInterval(updateStatus, 5000)

    return () => {
      collaborationService.off('connected', handleConnected)
      collaborationService.off('disconnected', handleDisconnected)
      collaborationService.off('connection-error', handleError)
      clearInterval(interval)
    }
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-400'
      case 'connecting': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return 'ph-check-circle'
      case 'connecting': return 'ph-spinner animate-spin'
      case 'error': return 'ph-x-circle'
      default: return 'ph-circle'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Backend Connected'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Backend Error'
      default: return 'Backend Offline'
    }
  }

  const handleReconnect = () => {
    collaborationService.connect()
  }

  const handleHealthCheck = async () => {
    try {
      const isHealthy = await collaborationService.checkServerHealth()
      if (isHealthy) {
        alert('✅ Backend server is healthy!')
      } else {
        alert('❌ Backend server is not responding')
      }
    } catch (error) {
      alert('❌ Failed to check backend health')
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1">
        <i className={`ph ${getStatusIcon()} ${getStatusColor()}`}></i>
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
      
      {status === 'error' || status === 'disconnected' ? (
        <button
          onClick={handleReconnect}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition"
          title="Reconnect to backend"
        >
          Reconnect
        </button>
      ) : null}
      
      <button
        onClick={handleHealthCheck}
        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition"
        title="Check backend health"
      >
        Health
      </button>
      
      {serverInfo && (
        <div className="text-gray-500 text-xs">
          {serverInfo.url.replace('http://', '').replace('https://', '')}
        </div>
      )}
    </div>
  )
}