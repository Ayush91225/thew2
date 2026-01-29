'use client'

import { useState, useEffect } from 'react'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'closing'

export default function BackendStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [serverInfo, setServerInfo] = useState<{ url: string; connected: boolean; documentId: string | null } | null>(null)

  useEffect(() => {
    let mounted = true
    
    const updateStatus = () => {
      if (!mounted) return
      try {
        // Mock implementation - replace with actual service when available
        setStatus('disconnected')
        setServerInfo(null)
      } catch (error) {
        if (mounted) {
          setStatus('error')
          setServerInfo(null)
        }
      }
    }

    // Initial status
    updateStatus()

    // Periodic status update
    const interval = setInterval(updateStatus, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-400'
      case 'connecting': return 'text-yellow-400'
      case 'closing': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return 'ph-check-circle'
      case 'connecting': return 'ph-spinner animate-spin'
      case 'closing': return 'ph-spinner animate-spin'
      case 'error': return 'ph-x-circle'
      default: return 'ph-circle'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Backend Connected'
      case 'connecting': return 'Connecting...'
      case 'closing': return 'Closing...'
      case 'error': return 'Backend Error'
      default: return 'Backend Offline'
    }
  }

  const handleReconnect = () => {
    try {
      setStatus('connecting')
      // Mock reconnection
      setTimeout(() => setStatus('disconnected'), 1000)
    } catch (error) {
      setStatus('error')
    }
  }

  const handleHealthCheck = async () => {
    try {
      alert('❌ Health check not available')
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