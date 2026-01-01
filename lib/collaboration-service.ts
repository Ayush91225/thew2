import { io, Socket } from 'socket.io-client'

export interface CollaborationUser {
  id: string
  name: string
  avatar: string
  cursor?: {
    line: number
    column: number
  }
}

export interface TextOperation {
  type: 'insert' | 'delete' | 'replace'
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
  private socket: Socket | null = null
  private isConnected = false
  private currentDocumentId: string | null = null
  private mode: 'solo' | 'live' = 'solo'
  private callbacks: Map<string, Function[]> = new Map()

  private readonly WS_URL = process.env.NEXT_PUBLIC_COLLABORATION_WS_URL || 'wss://xtc3torv9c.execute-api.ap-south-1.amazonaws.com/prod'
  private readonly API_URL = process.env.NEXT_PUBLIC_COLLABORATION_API_URL || 'https://1ngwyksutc.execute-api.ap-south-1.amazonaws.com/prod'

  connect(token: string) {
    if (this.socket?.connected) return

    this.socket = io(this.WS_URL, {
      auth: { token },
      transports: ['websocket']
    })

    this.socket.on('connect', () => {
      this.isConnected = true
      this.emit('connected')
    })

    this.socket.on('disconnect', () => {
      this.isConnected = false
      this.emit('disconnected')
    })

    this.socket.on('document-joined', (data) => {
      this.emit('document-joined', data)
    })

    this.socket.on('user-joined', (data) => {
      this.emit('user-joined', data)
    })

    this.socket.on('user-left', (data) => {
      this.emit('user-left', data)
    })

    this.socket.on('operation', (data) => {
      this.emit('operation', data)
    })

    this.socket.on('cursor-update', (data) => {
      this.emit('cursor-update', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  joinDocument(documentId: string, mode: 'solo' | 'live') {
    if (!this.socket?.connected) return

    this.currentDocumentId = documentId
    this.mode = mode

    this.socket.emit('join-document', { documentId, mode })
  }

  sendOperation(operation: TextOperation) {
    if (!this.socket?.connected || !this.currentDocumentId || this.mode === 'solo') return

    this.socket.emit('operation', {
      documentId: this.currentDocumentId,
      operation
    })
  }

  updateCursor(line: number, column: number) {
    if (!this.socket?.connected || !this.currentDocumentId || this.mode === 'solo') return

    this.socket.emit('cursor-update', {
      documentId: this.currentDocumentId,
      cursor: { line, column }
    })
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

  private emit(event: string, data?: any) {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  // API methods
  async createDocument(name: string, content: string = '', language: string = 'javascript') {
    const response = await fetch(`${this.API_URL}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, content, language })
    })

    if (!response.ok) {
      throw new Error('Failed to create document')
    }

    return response.json()
  }

  async getDocument(documentId: string) {
    const response = await fetch(`${this.API_URL}/api/documents/${documentId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch document')
    }

    return response.json()
  }

  getMode() {
    return this.mode
  }

  isLiveMode() {
    return this.mode === 'live'
  }

  isSoloMode() {
    return this.mode === 'solo'
  }
}

export const collaborationService = new CollaborationService()