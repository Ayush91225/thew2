import { OperationalTransform, RealTimeSync, Operation } from './operational-transform'

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

class CollaborationService {
  private static instance: CollaborationService
  private callbacks: Map<string, EventCallback[]> = new Map()
  private connectionStatus: ConnectionStatus = 'disconnected'
  private currentDocumentId: string | null = null
  private currentTabId: string | null = null
  private readonly storageKey: string = 'kriya-collab'

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService()
    }
    return CollaborationService.instance
  }

  constructor() {
    // Only add event listener on client side
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this))
    }
  }

  private handleStorageChange(e: StorageEvent) {
    if (e.key === this.storageKey && e.newValue) {
      try {
        const data = JSON.parse(e.newValue)
        
        // Ignore our own broadcasts
        if (data.tabId === this.currentTabId) {
          return
        }
        
        this.emit(data.type, data.payload)
      } catch (error) {
        // Ignore malformed JSON data
        console.warn('Failed to parse collaboration data')
      }
    }
  }

  private broadcast(type: string, payload: any) {
    if (typeof window !== 'undefined') {
      const data = { type, payload, timestamp: Date.now(), tabId: Math.random().toString(36) }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      
      // Store current tab ID to ignore our own broadcasts
      this.currentTabId = data.tabId
    }
  }

  connect(token: string): void {
    this.connectionStatus = 'connected'
    this.emit('connected')
  }

  disconnect(): void {
    this.connectionStatus = 'disconnected'
    this.currentDocumentId = null
  }

  joinDocument(documentId: string, mode: CollaborationMode): boolean {
    this.currentDocumentId = documentId
    
    setTimeout(() => {
      this.emit('document-joined', { 
        documentId, 
        mode, 
        users: [] 
      })
      
      // Broadcast to other tabs
      this.broadcast('user-joined', {
        id: 'current-user',
        name: 'Current User',
        documentId
      })
    }, 100)
    
    return true
  }

  private getCurrentDocumentContent(): string | null {
    // Get content from the active tab in the store
    if (typeof window !== 'undefined' && (window as any).useIDEStore) {
      try {
        const store = (window as any).useIDEStore.getState()
        const activeTab = store.tabs.find((tab: any) => tab.id === store.activeTab)
        return activeTab?.content || null
      } catch {
        return null
      }
    }
    return null
  }

  sendOperation(operation: TextOperation): boolean {
    if (!this.currentDocumentId) {
      return false
    }

    // Add userId and timestamp for better operation tracking
    const enrichedOperation = {
      ...operation,
      userId: 'current-user',
      timestamp: Date.now()
    }

    this.broadcast('operation', { operation: enrichedOperation, documentId: this.currentDocumentId })
    return true
  }

  updateCursor(line: number, column: number): boolean {
    if (!this.currentDocumentId) return false
    
    this.broadcast('cursor-update', {
      cursor: { line, column },
      documentId: this.currentDocumentId,
      userId: 'current-user'
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