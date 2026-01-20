interface BackendConfig {
  apiUrl: string
  wsUrl: string
  timeout?: number
}

class BackendClient {
  private config: BackendConfig
  private ws: WebSocket | null = null

  constructor(config: BackendConfig) {
    this.config = {
      timeout: 10000,
      ...config
    }
  }

  // HTTP API methods
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.apiUrl}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Document operations
  async createDocument(data: { name: string; content?: string; language?: string }) {
    return this.request('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getDocument(id: string) {
    return this.request(`/api/documents/${id}`)
  }

  async updateDocument(id: string, updates: any) {
    return this.request(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async listDocuments() {
    return this.request('/api/documents')
  }

  // WebSocket connection for real-time collaboration
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = token ? `${this.config.wsUrl}?token=${token}` : this.config.wsUrl
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => resolve()
      this.ws.onerror = (error) => reject(error)
      this.ws.onclose = () => {
        this.ws = null
      }
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // Real-time operations
  joinDocument(documentId: string, mode: 'solo' | 'live' = 'live') {
    this.send({ action: 'join-document', documentId, mode })
  }

  sendOperation(documentId: string, operation: any) {
    this.send({ action: 'operation', documentId, operation })
  }

  sendCursorUpdate(documentId: string, cursor: { line: number; column: number }) {
    this.send({ action: 'cursor-update', documentId, cursor })
  }

  onMessage(callback: (data: any) => void) {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          callback(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
}

// Create singleton instance
const backendClient = new BackendClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://1ngwyksutc.execute-api.ap-south-1.amazonaws.com/prod',
  wsUrl: process.env.NEXT_PUBLIC_COLLABORATION_WS_URL || 'wss://xtc3torv9c.execute-api.ap-south-1.amazonaws.com/prod'
})

export default backendClient
export { BackendClient }