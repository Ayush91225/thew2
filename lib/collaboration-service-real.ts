import backendClient from './backend-client'

interface CollaborationUser {
  id: string
  name: string
  avatar: string
  cursor?: { line: number; column: number }
}

interface Operation {
  type: 'insert' | 'delete'
  position: number
  content?: string
  length?: number
  range?: {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
  }
}

class CollaborationService {
  private documentId: string | null = null
  private mode: 'solo' | 'live' = 'solo'
  private users: Map<string, CollaborationUser> = new Map()
  private callbacks: Map<string, Function[]> = new Map()
  private connected = false

  async connect(token?: string) {
    try {
      await backendClient.connect(token)
      this.connected = true
      this.setupMessageHandlers()
    } catch (error) {
      console.error('Failed to connect to collaboration service:', error)
      throw error
    }
  }

  disconnect() {
    backendClient.disconnect()
    this.connected = false
    this.documentId = null
    this.users.clear()
  }

  async joinDocument(documentId: string, mode: 'solo' | 'live' = 'live') {
    if (!this.connected) {
      throw new Error('Not connected to collaboration service')
    }

    this.documentId = documentId
    this.mode = mode
    
    backendClient.joinDocument(documentId, mode)
  }

  sendOperation(operation: Operation) {
    if (!this.documentId || this.mode !== 'live') return
    
    backendClient.sendOperation(this.documentId, operation)
  }

  sendCursorUpdate(cursor: { line: number; column: number }) {
    if (!this.documentId || this.mode !== 'live') return
    
    backendClient.sendCursorUpdate(this.documentId, cursor)
  }

  getUsers(): CollaborationUser[] {
    return Array.from(this.users.values())
  }

  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  private setupMessageHandlers() {
    backendClient.onMessage((message) => {
      switch (message.type) {
        case 'document-joined':
          if (message.data.users) {
            this.users.clear()
            message.data.users.forEach((user: CollaborationUser) => {
              this.users.set(user.id, user)
            })
          }
          this.emit('document-joined', message.data)
          break

        case 'operation':
          this.emit('operation', message.data.operation)
          break

        case 'operation-confirmed':
          this.emit('operation-confirmed', message.data.operation)
          break

        case 'cursor-update':
          const user = this.users.get(message.data.userId)
          if (user) {
            user.cursor = message.data.cursor
            this.users.set(message.data.userId, user)
          }
          this.emit('cursor-update', message.data)
          break

        case 'user-joined':
          if (message.data.user) {
            this.users.set(message.data.user.id, message.data.user)
            this.emit('user-joined', message.data.user)
          }
          break

        case 'user-left':
          this.users.delete(message.data.userId)
          this.emit('user-left', { userId: message.data.userId })
          break

        case 'error':
          this.emit('error', message.data)
          break
      }
    })
  }
}

const collaborationService = new CollaborationService()

export default collaborationService
export { CollaborationService }
export type { CollaborationUser, Operation }