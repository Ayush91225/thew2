'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useIDEStore } from '@/stores/ide-store-new'
import { collaborationService } from '@/lib/collaboration-service'

// Secure logger
const logger = {
  info: (message: string): void => {
    console.info(`[CollaborationManager] ${message}`)
  },
  warn: (message: string): void => {
    console.warn(`[CollaborationManager] ${message}`)
  },
  error: (message: string): void => {
    console.error(`[CollaborationManager] ${message}`)
  }
}

// Input validation helpers
const isValidUserId = (userId: unknown): userId is string => {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 100
}

const isValidUserInfo = (userInfo: unknown): userInfo is { name?: string; avatar?: string } => {
  if (!userInfo || typeof userInfo !== 'object') return false
  const info = userInfo as Record<string, unknown>
  return (!info.name || typeof info.name === 'string') && 
         (!info.avatar || typeof info.avatar === 'string')
}

const sanitizeString = (input: string): string => {
  return input.replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    }
    return entities[match] || match
  })
}

export default function CollaborationManager() {
  const { collab, activeTab, tabs, setCollaborationConnection, setCollaborationUsers, addCollaborationUser, removeCollaborationUser } = useIDEStore()
  const isInitialized = useRef(false)
  const eventListenersRef = useRef<(() => void)[]>([])

  // Memoized event handlers for better performance
  const handleConnected = useCallback(() => {
    try {
      logger.info('Connected to collaboration service')
      setCollaborationConnection(true)
      
      if (activeTab) {
        const activeTabData = tabs.find(tab => tab.id === activeTab)
        if (activeTabData && activeTabData.name) {
          const sanitizedName = sanitizeString(activeTabData.name.substring(0, 50))
          const success = collaborationService.joinDocument(`shared-${sanitizedName}`, 'live')
          console.log('Document join result:', success, `shared-${sanitizedName}`)
        }
      }
    } catch (error) {
      logger.error('Failed to handle connection')
    }
  }, [activeTab, tabs, setCollaborationConnection])

  const handleDisconnected = useCallback(() => {
    try {
      logger.info('Disconnected from collaboration service')
      setCollaborationConnection(false)
      setCollaborationUsers([])
    } catch (error) {
      logger.error('Failed to handle disconnection')
    }
  }, [setCollaborationConnection, setCollaborationUsers])

  const handleDocumentJoined = useCallback((data: unknown) => {
    try {
      if (!data || typeof data !== 'object') {
        logger.warn('Invalid document joined data')
        return
      }
      
      const docData = data as Record<string, unknown>
      if (Array.isArray(docData.users)) {
        const userMap = new Map()
        docData.users.forEach((user: unknown) => {
          if (!user || typeof user !== 'object') return
          const userData = user as Record<string, unknown>
          if (isValidUserId(userData.id) && 
              (!userData.name || typeof userData.name === 'string') &&
              (!userData.avatar || typeof userData.avatar === 'string')) {
            const sanitizedId = sanitizeString(userData.id)
            userMap.set(sanitizedId, {
              id: sanitizedId,
              name: userData.name && typeof userData.name === 'string' ? sanitizeString(userData.name.substring(0, 50)) : sanitizedId,
              avatar: userData.avatar && typeof userData.avatar === 'string' && userData.avatar.startsWith('https://') 
                      ? userData.avatar 
                      : `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(sanitizedId)}`
            })
          }
        })
        const validUsers = Array.from(userMap.values())
        
        setCollaborationUsers(validUsers)
        logger.info(`Joined document with ${validUsers.length} users`)
      }
    } catch (error) {
      logger.error('Failed to handle document joined')
    }
  }, [setCollaborationUsers])

  const handleUserJoined = useCallback((data: unknown) => {
    try {
      if (!data || typeof data !== 'object') {
        logger.warn('Invalid user joined data')
        return
      }
      
      const userData = data as Record<string, unknown>
      if (isValidUserId(userData.userId) && isValidUserInfo(userData.userInfo)) {
        const sanitizedUserId = sanitizeString(userData.userId)
        const userInfo = userData.userInfo as { name?: string; avatar?: string }
        
        addCollaborationUser({
          id: sanitizedUserId,
          name: userInfo.name ? sanitizeString(userInfo.name.substring(0, 50)) : sanitizedUserId,
          avatar: userInfo.avatar && typeof userInfo.avatar === 'string' && userInfo.avatar.startsWith('https://') 
                  ? userInfo.avatar 
                  : `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(sanitizedUserId)}`
        })
        
        logger.info('User joined collaboration')
      } else {
        logger.warn('Invalid user data received')
      }
    } catch (error) {
      logger.error('Failed to handle user joined')
    }
  }, [addCollaborationUser])

  const handleUserLeft = useCallback((data: unknown) => {
    try {
      if (!data || typeof data !== 'object') {
        logger.warn('Invalid user left data')
        return
      }
      
      const userData = data as Record<string, unknown>
      if (isValidUserId(userData.userId)) {
        const sanitizedUserId = sanitizeString(userData.userId)
        removeCollaborationUser(sanitizedUserId)
        logger.info('User left collaboration')
      } else {
        logger.warn('Invalid user ID in user left event')
      }
    } catch (error) {
      logger.error('Failed to handle user left')
    }
  }, [removeCollaborationUser])

  const handleError = useCallback((error: unknown) => {
    try {
      logger.error('Collaboration service error occurred')
      setCollaborationConnection(false)
    } catch (err) {
      logger.error('Failed to handle collaboration error')
    }
  }, [setCollaborationConnection])

  useEffect(() => {
    if (collab && !isInitialized.current) {
      try {
        const token = 'demo-user-token'
        
        // Set up event listeners with proper cleanup tracking
        const cleanupFunctions: (() => void)[] = []
        
        // Connection events
        collaborationService.on('connected', handleConnected)
        cleanupFunctions.push(() => collaborationService.off('connected', handleConnected))

        collaborationService.on('disconnected', handleDisconnected)
        cleanupFunctions.push(() => collaborationService.off('disconnected', handleDisconnected))

        // Document events
        collaborationService.on('document-joined', handleDocumentJoined)
        cleanupFunctions.push(() => collaborationService.off('document-joined', handleDocumentJoined))

        // User events
        collaborationService.on('user-joined', handleUserJoined)
        cleanupFunctions.push(() => collaborationService.off('user-joined', handleUserJoined))

        collaborationService.on('user-left', handleUserLeft)
        cleanupFunctions.push(() => collaborationService.off('user-left', handleUserLeft))

        // Error handling
        collaborationService.on('error', handleError)
        cleanupFunctions.push(() => collaborationService.off('error', handleError))

        eventListenersRef.current = cleanupFunctions

        collaborationService.connect(token)
        isInitialized.current = true
        logger.info('Collaboration manager initialized')
        
      } catch (error) {
        logger.error('Failed to initialize collaboration')
        setCollaborationConnection(false)
      }
    } else if (!collab && isInitialized.current) {
      try {
        // Clean up event listeners
        eventListenersRef.current.forEach((cleanup: () => void) => {
          try {
            cleanup()
          } catch (error) {
            logger.warn('Failed to cleanup event listener')
          }
        })
        eventListenersRef.current = []
        
        collaborationService.disconnect()
        setCollaborationConnection(false)
        setCollaborationUsers([])
        isInitialized.current = false
        logger.info('Collaboration manager cleaned up')
      } catch (error) {
        logger.error('Failed to cleanup collaboration')
      }
    }
  }, [collab, handleConnected, handleDisconnected, handleDocumentJoined, handleUserJoined, handleUserLeft, handleError, setCollaborationConnection, setCollaborationUsers])

  // Handle tab changes for document switching with proper validation
  useEffect(() => {
    if (collab && isInitialized.current && activeTab) {
      try {
        // Always use the same fixed document ID for all users
        const documentId = 'shared-document'
        const success = collaborationService.joinDocument(documentId, 'live')
        if (success) {
          logger.info(`Switched to document: ${documentId}`)
        } else {
          logger.warn(`Failed to join document: ${documentId}`)
        }
      } catch (error) {
        logger.error('Failed to handle tab change')
      }
    }
  }, [collab, activeTab, tabs])

  return null
}