import { useEffect, useRef, useState } from 'react'
import { collaborationService } from '../lib/collaboration-service'

export function useCollaborativeEditor(documentId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (!documentId) return

    collaborationService.connect('demo-token')
    setIsConnected(true)

    const handleUserJoined = (data: any) => {
      setUsers(prev => [...prev.filter(u => u.id !== data.id), data])
    }

    collaborationService.on('user-joined', handleUserJoined)
    collaborationService.on('connected', () => setIsConnected(true))
    collaborationService.on('disconnected', () => setIsConnected(false))

    return () => {
      collaborationService.off('user-joined', handleUserJoined)
      collaborationService.disconnect()
      setIsConnected(false)
    }
  }, [documentId])

  const joinDocument = (mode: 'solo' | 'live') => {
    return collaborationService.joinDocument(documentId, mode)
  }

  return {
    joinDocument,
    isConnected,
    users
  }
}