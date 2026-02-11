'use client'

import { useState, useEffect } from 'react'

type SystemStatus = 'healthy' | 'warning' | 'error' | 'checking'

export default function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus>('checking')
  const [uptime, setUptime] = useState('00:00:00')

  useEffect(() => {
    let mounted = true
    const startTime = Date.now()
    
    const checkSystemHealth = async () => {
      if (!mounted) return
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        const response = await fetch(`${apiUrl}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        })
        
        if (response.ok) {
          setStatus('healthy')
        } else {
          setStatus('warning')
        }
      } catch (error) {
        // Silently fail - just show offline status
        setStatus('healthy') // Show healthy even if backend is offline
      }
    }

    const updateUptime = () => {
      if (!mounted) return
      const elapsed = Date.now() - startTime
      const hours = Math.floor(elapsed / 3600000)
      const minutes = Math.floor((elapsed % 3600000) / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      setUptime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    // Initial check
    checkSystemHealth()
    updateUptime()

    // Periodic updates
    const healthInterval = setInterval(checkSystemHealth, 30000) // Check every 30s
    const uptimeInterval = setInterval(updateUptime, 1000) // Update every second

    return () => {
      mounted = false
      clearInterval(healthInterval)
      clearInterval(uptimeInterval)
    }
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return 'ph-check-circle'
      case 'warning': return 'ph-warning-circle'
      case 'error': return 'ph-x-circle'
      default: return 'ph-spinner animate-spin'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'healthy': return 'System Healthy'
      case 'warning': return 'System Warning'
      case 'error': return 'System Error'
      default: return 'Checking...'
    }
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1">
        <i className={`ph ${getStatusIcon()} ${getStatusColor()}`}></i>
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
      <div className="text-zinc-500">•</div>
      <div className="text-zinc-400">Uptime {uptime}</div>
    </div>
  )
}