interface DatabaseConnection {
  id: string
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb'
  host: string
  port?: number
  database: string
  username: string
  isConnected: boolean
  createdAt: Date
}

interface QueryResult {
  rows: any[]
  rowCount: number
  executionTime: number
}

interface ConnectionConfig {
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb'
  host: string
  port?: number
  database: string
  username: string
  password?: string
}

class DatabaseService {
  private baseUrl = '/api/database'

  async connect(config: ConnectionConfig): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', ...config })
      })
      
      const result = await response.json()
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  async executeQuery(connectionId: string, sql: string): Promise<{ success: boolean; data?: any[]; rowCount?: number; executionTime?: number; error?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', connectionId, sql })
      })
      
      const result = await response.json()
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed'
      }
    }
  }

  async disconnect(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', connectionId })
      })
      
      const result = await response.json()
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed'
      }
    }
  }

  async getConnections(): Promise<{ success: boolean; connections?: DatabaseConnection[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}?action=connections`)
      const result = await response.json()
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch connections'
      }
    }
  }

  async getTables(connectionId: string): Promise<{ success: boolean; tables?: string[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}?action=tables&connectionId=${connectionId}`)
      const result = await response.json()
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tables'
      }
    }
  }
}

export const databaseService = new DatabaseService()
export type { DatabaseConnection, QueryResult, ConnectionConfig }