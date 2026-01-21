import { io, Socket } from 'socket.io-client'

export interface CollaborationUser {
  readonly id: string
  readonly name: string
  readonly avatar: string
  readonly cursor?: {
    readonly line: number
    readonly column: number
  }
}

export interface TextOperation {
  readonly type: 'insert' | 'delete' | 'replace'
  readonly position: number
  readonly content?: string
  readonly length?: number
  readonly range?: {
    readonly startLine: number
    readonly startColumn: number
    readonly endLine: number
    readonly endColumn: number
  }
  readonly userId?: string
  readonly timestamp?: number
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'closing' | 'error'
type CollaborationMode = 'solo' | 'live'
type EventCallback = (data?: unknown) => void

class RealCollaborationService {
  private static instance: RealCollaborationService
  private socket: Socket | null = null
  private callbacks: Map<string, EventCallback[]> = new Map()
  private connectionStatus: ConnectionStatus = 'disconnected'
  private currentDocumentId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  // Backend URL - change this to your local backend
  private readonly BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://kriya-backend.navchetna.tech' 
    : 'http://localhost:8080'

  static getInstance(): RealCollaborationService {
    if (!RealCollaborationService.instance) {
      RealCollaborationService.instance = new RealCollaborationService()
    }
    return RealCollaborationService.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeConnection()
    }
  }

  private initializeConnection(): void {
    try {
      this.connectionStatus = 'connecting'
      
      this.socket = io(this.BACKEND_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      })

      this.setupSocketListeners()
    } catch (error) {
      console.error('Failed to initialize socket connection:', error)
      this.connectionStatus = 'error'
      this.emit('connection-error', { error: 'Failed to connect to collaboration server' })
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ Connected to collaboration server')
      this.connectionStatus = 'connected'
      this.reconnectAttempts = 0
      this.emit('connected')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from collaboration server:', reason)
      this.connectionStatus = 'disconnected'
      this.emit('disconnected', { reason })
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Connection error:', error.message)
      this.connectionStatus = 'error'
      this.emit('connection-error', { error: error.message })
      
      // Implement exponential backoff for reconnection
      this.reconnectAttempts++
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
        console.log(`🔄 Retrying connection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        setTimeout(() => this.initializeConnection(), delay)
      }
    })

    // Document collaboration events
    this.socket.on('document-joined', (data) => {
      console.log('📄 Document joined:', data.documentId)
      this.emit('document-joined', data)
    })

    this.socket.on('operation', (data) => {
      this.emit('operation', data)
    })

    this.socket.on('cursor-update', (data) => {
      this.emit('cursor-update', data)
    })

    this.socket.on('user-joined', (data) => {
      console.log('👤 User joined:', data.userId)
      this.emit('user-joined', data)
    })

    this.socket.on('user-left', (data) => {
      console.log('👋 User left:', data.userId)
      this.emit('user-left', data)
    })

    this.socket.on('users-update', (data) => {
      this.emit('users-update', data)
    })

    this.socket.on('error', (data) => {
      console.error('❌ Server error:', data.message)
      this.emit('error', data)
    })
  }

  connect(token?: string): void {
    if (this.connectionStatus === 'connected') {
      return
    }

    if (!this.socket || this.socket.disconnected) {
      this.initializeConnection()
    } else {
      this.socket.connect()
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
    }
    this.connectionStatus = 'disconnected'
    this.currentDocumentId = null
  }

  joinDocument(documentId: string, mode: CollaborationMode): boolean {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Cannot join document: not connected to server')
      return false
    }

    this.currentDocumentId = documentId
    
    this.socket.emit('join-document', {
      documentId,
      mode
    })

    return true
  }

  sendOperation(operation: TextOperation): boolean {
    if (!this.socket || !this.socket.connected || !this.currentDocumentId) {
      console.warn('⚠️ Cannot send operation: not connected or no active document')
      return false
    }

    // Add metadata to operation
    const enrichedOperation = {
      ...operation,
      userId: this.socket.id,
      timestamp: Date.now()
    }

    this.socket.emit('operation', {
      documentId: this.currentDocumentId,
      operation: enrichedOperation
    })

    return true
  }

  updateCursor(line: number, column: number): boolean {
    if (!this.socket || !this.socket.connected || !this.currentDocumentId) {
      return false
    }

    this.socket.emit('cursor-update', {
      documentId: this.currentDocumentId,
      cursor: { line, column }
    })

    return true
  }

  on(event: string, callback: EventCallback): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  getCurrentDocumentId(): string | null {
    return this.currentDocumentId
  }

  isConnected(): boolean {
    return this.socket?.connected === true
  }

  // Health check method
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/health`)
      const data = await response.json()
      return data.status === 'healthy'
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  private emit(event: string, data?: unknown): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Callback error:', error)
        }
      })
    }
  }

  // Utility method to get server info
  getServerInfo(): { url: string; connected: boolean; documentId: string | null } {
    return {
      url: this.BACKEND_URL,
      connected: this.isConnected(),
      documentId: this.currentDocumentId
    }
  }
}

export const collaborationService = RealCollaborationService.getInstance()
export { RealCollaborationService }