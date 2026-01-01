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
  private ws: WebSocket | null = null
  private isConnected = false
  private currentDocumentId: string | null = null
  private mode: 'solo' | 'live' = 'solo'
  private callbacks: Map<string, Function[]> = new Map()

  private readonly WS_URL = process.env.NEXT_PUBLIC_COLLABORATION_WS_URL || 'wss://xtc3torv9c.execute-api.ap-south-1.amazonaws.com/prod'
  private readonly API_URL = process.env.NEXT_PUBLIC_COLLABORATION_API_URL || 'https://1ngwyksutc.execute-api.ap-south-1.amazonaws.com/prod'

  connect(token: string) {
    if (typeof window === 'undefined') return
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.ws = new WebSocket(`${this.WS_URL}?token=${token}`)

    this.ws.onopen = () => {
      this.isConnected = true
      this.emit('connected')
    }

    this.ws.onclose = () => {
      this.isConnected = false
      this.emit('disconnected')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.emit(data.type, data.data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected = false
    }
  }

  joinDocument(documentId: string, mode: 'solo' | 'live') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    this.currentDocumentId = documentId
    this.mode = mode

    this.send('join-document', { documentId, mode })
  }

  sendOperation(operation: TextOperation) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.currentDocumentId || this.mode === 'solo') return

    this.send('operation', {
      documentId: this.currentDocumentId,
      operation
    })
  }

  updateCursor(line: number, column: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.currentDocumentId || this.mode === 'solo') return

    this.send('cursor-update', {
      documentId: this.currentDocumentId,
      cursor: { line, column }
    })
  }

  private send(action: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...data }))
    }
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