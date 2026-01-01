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
    
    console.log('🔌 Connecting to collaboration service...', this.WS_URL)
    
    try {
      // Use native WebSocket for API Gateway
      this.ws = new WebSocket(`${this.WS_URL}?token=${token}`)

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully')
        this.isConnected = true
        this.emit('connected')
      }

      this.ws.onclose = (event) => {
        console.log('❌ WebSocket disconnected', event.code, event.reason)
        this.isConnected = false
        this.emit('disconnected', { code: event.code, reason: event.reason })
        
        // Auto-reconnect after 3 seconds if not a clean close
        if (event.code !== 1000) {
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect...')
            this.connect(token)
          }, 3000)
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 Message received:', data)
          
          // Handle different message formats
          if (data.type) {
            this.emit(data.type, data.data || data)
          } else if (data.action) {
            this.emit(data.action, data)
          } else {
            // Fallback for direct data
            this.emit('message', data)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, event.data)
        }
      }

      this.ws.onerror = (error) => {
        console.error('🚨 WebSocket error:', error)
        this.emit('error', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.emit('error', error)
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
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot join document')
      return
    }

    this.currentDocumentId = documentId
    this.mode = mode
    
    console.log(`📄 Joining document ${documentId} in ${mode} mode`)
    
    const success = this.send('join-document', { documentId, mode })
    if (success) {
      console.log('✅ Join document message sent successfully')
    } else {
      console.error('❌ Failed to send join document message')
    }
  }

  sendOperation(operation: TextOperation, documentId?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.currentDocumentId || this.mode === 'solo') return

    this.send('operation', {
      documentId: documentId || this.currentDocumentId,
      operation
    })
  }

  updateCursor(line: number, column: number, documentId?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.currentDocumentId || this.mode === 'solo') return

    this.send('cursor-update', {
      documentId: documentId || this.currentDocumentId,
      cursor: { line, column }
    })
  }

  private send(action: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ action, ...data })
      console.log('📤 Sending:', message)
      this.ws.send(message)
      return true
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message:', action)
      return false
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

  getConnectionStatus() {
    if (!this.ws) return 'disconnected'
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'connected'
      case WebSocket.CLOSING: return 'closing'
      case WebSocket.CLOSED: return 'disconnected'
      default: return 'unknown'
    }
  }
}

export const collaborationService = new CollaborationService()