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
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'closing' | 'error'
type CollaborationMode = 'solo' | 'live'
type EventCallback = (data?: unknown) => void

interface LogContext {
  readonly action: string
  readonly timestamp: number
  readonly level: 'info' | 'warn' | 'error'
}

const CONFIG = {
  RECONNECT_DELAY: 3000,
  MAX_MESSAGE_SIZE: 10000,
  CONNECTION_TIMEOUT: 30000,
  MAX_RECONNECT_ATTEMPTS: 5,
  URL_VALIDATION_TIMEOUT: 5000
} as const

class CollaborationService {
  private ws: WebSocket | null = null
  private isConnected = false
  private currentDocumentId: string | null = null
  private mode: CollaborationMode = 'solo'
  private callbacks: Map<string, EventCallback[]> = new Map()
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = CONFIG.MAX_RECONNECT_ATTEMPTS
  private readonly allowedDomains = new Set([
    'execute-api.ap-south-1.amazonaws.com',
    'api.kriya.navchetna.tech'
  ])

  private readonly WS_URL = this.sanitizeUrl(process.env.NEXT_PUBLIC_COLLABORATION_WS_URL) || 'wss://vvswi3elpi.execute-api.ap-south-1.amazonaws.com/prod'
  private readonly API_URL = this.sanitizeUrl(process.env.NEXT_PUBLIC_COLLABORATION_API_URL) || 'https://1ngwyksutc.execute-api.ap-south-1.amazonaws.com/prod'

  private sanitizeUrl(url: string | undefined): string | null {
    if (!url || typeof url !== 'string') return null
    try {
      const parsedUrl = new URL(url)
      if (!this.allowedDomains.has(parsedUrl.hostname)) return null
      if (!['https:', 'wss:'].includes(parsedUrl.protocol)) return null
      return url
    } catch {
      return null
    }
  }

  private validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false
    try {
      const parsedUrl = new URL(url)
      return this.allowedDomains.has(parsedUrl.hostname) && 
             ['https:', 'wss:'].includes(parsedUrl.protocol)
    } catch {
      return false
    }
  }

  private safeJsonParse(data: string): Record<string, unknown> | null {
    if (!data || typeof data !== 'string') return null
    if (data.length > CONFIG.MAX_MESSAGE_SIZE) return null
    
    try {
      const parsed = JSON.parse(data)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  private safeJsonStringify(data: Record<string, unknown>): string | null {
    if (!data || typeof data !== 'object') return null
    
    try {
      const str = JSON.stringify(data)
      return str.length <= CONFIG.MAX_MESSAGE_SIZE ? str : null
    } catch {
      return null
    }
  }

  private sanitizeForLog(input: unknown): string {
    if (typeof input === 'string') {
      return input.replace(/[\r\n\t]/g, '_').substring(0, 100)
    }
    return String(input).replace(/[\r\n\t]/g, '_').substring(0, 100)
  }

  private logSecurely(context: LogContext, message: string): void {
    const sanitizedMessage = this.sanitizeForLog(message)
    const logEntry = {
      ...context,
      message: sanitizedMessage,
      service: 'CollaborationService'
    }
    console.log(JSON.stringify(logEntry))
  }

  connect(token: string): void {
    if (typeof window === 'undefined') {
      this.logSecurely({ action: 'connect', timestamp: Date.now(), level: 'warn' }, 'Window undefined')
      return
    }
    
    if (!this.validateUrl(this.WS_URL)) {
      this.logSecurely({ action: 'connect', timestamp: Date.now(), level: 'error' }, 'Invalid WebSocket URL')
      this.emit('error', new Error('Invalid WebSocket URL'))
      return
    }
    
    try {
      if (!this.validateToken(token)) {
        throw new Error('Invalid token format')
      }

      this.ws = new WebSocket(`${this.WS_URL}?token=${encodeURIComponent(token)}`)

      this.ws.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connected')
      }

      this.ws.onclose = (event) => {
        this.isConnected = false
        const sanitizedReason = this.sanitizeForLog(event.reason)
        this.logSecurely({ action: 'disconnect', timestamp: Date.now(), level: 'info' }, `Code: ${event.code}`)
        this.emit('disconnected', { code: event.code, reason: sanitizedReason })
        
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(CONFIG.RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), 30000)
          this.reconnectAttempts++
          
          setTimeout(() => {
            this.connect(token)
          }, delay)
        }
      }

      this.ws.onmessage = (event) => {
        const messageData = this.safeJsonParse(event.data)
        if (!messageData) return

        this.handleMessage(messageData)
      }

      this.ws.onerror = () => {
        this.logSecurely({ action: 'websocket_error', timestamp: Date.now(), level: 'error' }, 'Connection error')
        this.emit('error', new Error('WebSocket connection error'))
      }
    } catch (error) {
      this.logSecurely({ action: 'connect', timestamp: Date.now(), level: 'error' }, 'Connection failed')
      this.emit('error', error instanceof Error ? error : new Error('Connection failed'))
    }
  }

  private validateToken(token: string): boolean {
    return !!(token && typeof token === 'string' && token.length > 0 && token.length <= 1000)
  }

  private handleMessage(messageData: Record<string, unknown>): void {
    try {
      const sanitizedType = this.sanitizeForLog(messageData.type)
      
      if (messageData.type === 'operation' && this.isValidOperation(messageData.operation)) {
        this.emit('operation', messageData.operation)
      } else if (messageData.type === 'cursor-update' && this.isValidCursor(messageData)) {
        this.emit('cursor-update', { 
          userId: this.sanitizeForLog(messageData.userId), 
          cursor: messageData.cursor 
        })
      } else if (typeof messageData.type === 'string' && messageData.type.length <= 50) {
        this.emit(sanitizedType, messageData.data || messageData)
      } else if (typeof messageData.action === 'string' && messageData.action.length <= 50) {
        this.emit(this.sanitizeForLog(messageData.action), messageData)
      } else {
        this.emit('message', messageData)
      }
    } catch (error) {
      this.logSecurely({ action: 'handle_message', timestamp: Date.now(), level: 'error' }, 'Message handling failed')
    }
  }

  private isValidOperation(operation: unknown): boolean {
    return !!(operation && typeof operation === 'object' && operation !== null)
  }

  private isValidCursor(data: Record<string, unknown>): boolean {
    return !!(data.cursor && typeof data.cursor === 'object' && data.userId)
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000) // Normal closure
      this.ws = null
      this.isConnected = false
    }
  }

  joinDocument(documentId: string, mode: CollaborationMode): boolean {
    try {
      if (!this.isWebSocketReady()) return false
      if (!this.validateDocumentId(documentId)) return false
      if (!this.validateMode(mode)) return false

      this.currentDocumentId = documentId
      this.mode = mode
      
      return this.send('join-document', { documentId, mode })
    } catch (error) {
      this.logSecurely({ action: 'join_document', timestamp: Date.now(), level: 'error' }, 'Failed to join document')
      return false
    }
  }

  private isWebSocketReady(): boolean {
    return !!(this.ws && this.ws.readyState === WebSocket.OPEN)
  }

  private validateDocumentId(documentId: string): boolean {
    return !!(documentId && typeof documentId === 'string' && 
             documentId.length > 0 && documentId.length <= 100 &&
             /^[a-zA-Z0-9_-]+$/.test(documentId))
  }

  private validateMode(mode: CollaborationMode): boolean {
    return ['solo', 'live'].includes(mode)
  }

  sendOperation(operation: TextOperation, documentId?: string): boolean {
    try {
      if (!this.canSendOperations()) return false
      if (!this.validateOperation(operation)) return false

      const targetDocId = documentId || this.currentDocumentId
      if (!targetDocId || !this.validateDocumentId(targetDocId)) return false

      return this.send('operation', { documentId: targetDocId, operation })
    } catch (error) {
      this.logSecurely({ action: 'send_operation', timestamp: Date.now(), level: 'error' }, 'Failed to send operation')
      return false
    }
  }

  private canSendOperations(): boolean {
    return this.isWebSocketReady() && !!this.currentDocumentId && this.mode !== 'solo'
  }

  private validateOperation(operation: TextOperation): boolean {
    if (!operation || typeof operation !== 'object') return false
    if (!['insert', 'delete', 'replace'].includes(operation.type)) return false
    if (typeof operation.position !== 'number' || operation.position < 0) return false
    return true
  }

  updateCursor(line: number, column: number, documentId?: string): boolean {
    try {
      if (!this.canSendOperations()) return false
      if (!this.validateCursorPosition(line, column)) return false

      const targetDocId = documentId || this.currentDocumentId
      if (!targetDocId || !this.validateDocumentId(targetDocId)) return false

      return this.send('cursor-update', {
        documentId: targetDocId,
        cursor: { line, column }
      })
    } catch (error) {
      this.logSecurely({ action: 'update_cursor', timestamp: Date.now(), level: 'error' }, 'Failed to update cursor')
      return false
    }
  }

  private validateCursorPosition(line: number, column: number): boolean {
    return typeof line === 'number' && typeof column === 'number' &&
           line >= 1 && column >= 1 && line <= 10000 && column <= 1000
  }

  private send(action: string, data: Record<string, unknown>): boolean {
    if (!this.isWebSocketReady()) return false

    try {
      const payload = { action, ...data }
      const message = this.safeJsonStringify(payload)
      if (!message) return false
      
      this.ws!.send(message)
      return true
    } catch (error) {
      this.logSecurely({ action: 'send', timestamp: Date.now(), level: 'error' }, 'Failed to send message')
      return false
    }
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

  private emit(event: string, data?: unknown): void {
    const callbacks = this.callbacks.get(event)
    if (!callbacks?.length) return

    callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        this.logSecurely({ action: 'emit_callback', timestamp: Date.now(), level: 'error' }, `Callback failed for event: ${this.sanitizeForLog(event)}`)
      }
    })
  }

  async createDocument(name: string, content = '', language = 'javascript'): Promise<Record<string, unknown>> {
    if (!this.validateUrl(this.API_URL)) {
      throw new Error('Invalid API URL')
    }

    const validatedInputs = this.validateDocumentInputs(name, content, language)
    if (!validatedInputs) {
      throw new Error('Invalid document parameters')
    }

    try {
      const payload = this.safeJsonStringify(validatedInputs)
      if (!payload) {
        throw new Error('Failed to serialize document data')
      }

      const response = await this.makeSecureRequest(`${this.API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Document creation failed`)
      }

      const result = await response.json()
      return typeof result === 'object' && result !== null ? result as Record<string, unknown> : {}
    } catch (error) {
      this.logSecurely({ action: 'create_document', timestamp: Date.now(), level: 'error' }, 'Document creation failed')
      throw new Error('Document creation failed')
    }
  }

  private validateDocumentInputs(name: string, content: string, language: string): Record<string, string> | null {
    if (!name || typeof name !== 'string' || name.length === 0 || name.length > 100) return null
    if (typeof content !== 'string' || content.length > 100000) return null
    if (!language || typeof language !== 'string' || language.length === 0 || language.length > 50) return null
    
    const sanitizedName = name.replace(/[<>"'&]/g, '')
    const sanitizedLanguage = language.replace(/[^a-zA-Z0-9_-]/g, '')
    
    return { name: sanitizedName, content, language: sanitizedLanguage }
  }

  private async makeSecureRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.URL_VALIDATION_TIMEOUT)
    
    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async getDocument(documentId: string): Promise<Record<string, unknown>> {
    if (!this.validateUrl(this.API_URL)) {
      throw new Error('Invalid API URL')
    }

    if (!this.validateDocumentId(documentId)) {
      throw new Error('Invalid document ID')
    }

    const sanitizedId = encodeURIComponent(documentId)

    try {
      const response = await this.makeSecureRequest(`${this.API_URL}/api/documents/${sanitizedId}`, {
        method: 'GET'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch document`)
      }

      const result = await response.json()
      return typeof result === 'object' && result !== null ? result as Record<string, unknown> : {}
    } catch (error) {
      this.logSecurely({ action: 'get_document', timestamp: Date.now(), level: 'error' }, 'Document fetch failed')
      throw new Error('Document fetch failed')
    }
  }

  getMode(): CollaborationMode {
    return this.mode
  }

  isLiveMode(): boolean {
    return this.mode === 'live'
  }

  getConnectionStatus(): ConnectionStatus {
    if (!this.ws) return 'disconnected'
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'connected'
      case WebSocket.CLOSING: return 'closing'
      case WebSocket.CLOSED: return 'disconnected'
      default: return 'error'
    }
  }
}

export const collaborationService = new CollaborationService()