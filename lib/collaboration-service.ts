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

class CollaborationService {
  private static instance: CollaborationService
  private ws: WebSocket | null = null
  private callbacks: Map<string, EventCallback[]> = new Map()

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService()
    }
    return CollaborationService.instance
  }

  connect(token: string): void {
    // Collaboration service disabled for security
    console.warn('Collaboration service not configured')
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  joinDocument(documentId: string, mode: CollaborationMode): boolean {
    return false
  }

  sendOperation(operation: TextOperation): boolean {
    return false
  }

  updateCursor(line: number, column: number): boolean {
    return false
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
    return 'disconnected'
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
}

export const collaborationService = CollaborationService.getInstance()