'use client'

import { useEffect, useRef } from 'react'
import { useIDEStore } from '@/stores/ide-store'
import { collaborationService } from '@/lib/collaboration-service'

export default function CollaborationManager() {
  const { collab, activeTab, tabs, setCollaborationConnection } = useIDEStore()
  const isInitialized = useRef(false)

  useEffect(() => {
    if (collab && !isInitialized.current) {
      const token = 'demo-user-token'
      
      collaborationService.on('connected', () => {
        setCollaborationConnection(true)
        if (activeTab) {
          const activeTabData = tabs.find(tab => tab.id === activeTab)
          if (activeTabData) {
            collaborationService.joinDocument(`shared-${activeTabData.name}`, 'live')
          }
        }
      })

      collaborationService.on('disconnected', () => {
        setCollaborationConnection(false)
      })

      collaborationService.connect(token)
      isInitialized.current = true
    } else if (!collab && isInitialized.current) {
      collaborationService.disconnect()
      setCollaborationConnection(false)
      isInitialized.current = false
    }
  }, [collab, activeTab, tabs, setCollaborationConnection])

  return null
}