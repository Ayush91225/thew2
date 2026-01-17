import { StateCreator } from 'zustand'

interface DatabaseConnection {
  id: string
  name: string
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

export interface DatabaseSlice {
  connections: DatabaseConnection[]
  activeConnection: string | null
  query: string
  results: QueryResult | null
  loading: boolean
  tables: string[]
  
  connectToDatabase: (config: any) => Promise<void>
  disconnectFromDatabase: (connectionId: string) => Promise<void>
  executeQuery: (connectionId: string, sql: string) => Promise<void>
  setQuery: (query: string) => void
  setActiveConnection: (connectionId: string | null) => void
  refreshTables: (connectionId: string) => Promise<void>
}

export const createDatabaseSlice: StateCreator<any, [], [], DatabaseSlice> = (set, get, store) => ({
  connections: [],
  activeConnection: null,
  query: '',
  results: null,
  loading: false,
  tables: [],
  
  connectToDatabase: async (config) => {
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', ...config })
      })
      const result = await response.json()
      
      if (result.success) {
        const connection: DatabaseConnection = {
          id: result.connectionId,
          name: `${config.type}://${config.host}/${config.database}`,
          type: config.type,
          host: config.host,
          port: config.port,
          database: config.database,
          username: config.username,
          isConnected: true,
          createdAt: new Date()
        }
        
        set((state: DatabaseSlice) => ({
          connections: [...state.connections, connection],
          activeConnection: connection.id
        }))
      }
    } catch (error) {
      console.error('Database connection failed:', error)
    }
  },
  
  disconnectFromDatabase: async (connectionId) => {
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', connectionId })
      })
      const result = await response.json()
      
      if (result.success) {
        set((state: DatabaseSlice) => ({
          connections: state.connections.filter((conn: DatabaseConnection) => conn.id !== connectionId),
          activeConnection: state.activeConnection === connectionId ? null : state.activeConnection
        }))
      }
    } catch (error) {
      console.error('Database disconnect failed:', error)
    }
  },
  
  executeQuery: async (connectionId, sql) => {
    set({ loading: true, results: null })
    
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', connectionId, sql })
      })
      const result = await response.json()
      
      if (result.success) {
        set({
          results: {
            rows: result.data || [],
            rowCount: result.rowCount || 0,
            executionTime: result.executionTime || 0
          },
          loading: false
        })
      } else {
        set({ loading: false })
      }
    } catch (error) {
      set({ loading: false })
      console.error('Query execution failed:', error)
    }
  },
  
  setQuery: (query) => set({ query }),
  setActiveConnection: (connectionId) => set({ activeConnection: connectionId }),
  
  refreshTables: async (connectionId) => {
    try {
      const response = await fetch(`/api/database?action=tables&connectionId=${connectionId}`)
      const result = await response.json()
      
      if (result.success) {
        set({ tables: result.tables || [] })
      }
    } catch (error) {
      console.error('Failed to refresh tables:', error)
    }
  }
})