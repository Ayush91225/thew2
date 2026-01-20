interface DatabaseConnection {
  id: string
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb'
  host: string
  port?: number
  database: string
  username: string
  password?: string
  client?: any
  isConnected: boolean
  createdAt: Date
}

interface QueryResult {
  rows: any[]
  rowCount: number
  executionTime: number
}

class DatabaseManager {
  private connections = new Map<string, DatabaseConnection>()

  async createConnection(config: Omit<DatabaseConnection, 'id' | 'client' | 'isConnected' | 'createdAt'>): Promise<DatabaseConnection> {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const connection: DatabaseConnection = {
      id,
      ...config,
      isConnected: true,
      createdAt: new Date()
    }

    this.connections.set(id, connection)
    return connection
  }

  async executeQuery(connectionId: string, sql: string): Promise<QueryResult> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) {
      throw new Error('Connection not found or not connected')
    }

    const startTime = Date.now()
    return {
      rows: [],
      rowCount: 0,
      executionTime: Date.now() - startTime
    }
  }

  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      throw new Error('Connection not found')
    }
    
    connection.isConnected = false
    this.connections.delete(connectionId)
  }

  getConnections(): DatabaseConnection[] {
    return Array.from(this.connections.values()).map(conn => ({
      ...conn,
      client: undefined,
      password: undefined // Don't expose password
    }))
  }

  getConnection(connectionId: string): DatabaseConnection | undefined {
    const conn = this.connections.get(connectionId)
    return conn ? { ...conn, client: undefined, password: undefined } : undefined
  }

  async getTables(connectionId: string): Promise<string[]> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) {
      throw new Error('Connection not found or not connected')
    }
    
    return []
  }
}

const databaseManager = new DatabaseManager()

export const createConnection = (config: any) => databaseManager.createConnection(config)
export const executeQuery = (connectionId: string, sql: string) => databaseManager.executeQuery(connectionId, sql)
export const closeConnection = (connectionId: string) => databaseManager.closeConnection(connectionId)
export const getConnections = () => databaseManager.getConnections()
export const getConnection = (connectionId: string) => databaseManager.getConnection(connectionId)
export const getTables = (connectionId: string) => databaseManager.getTables(connectionId)