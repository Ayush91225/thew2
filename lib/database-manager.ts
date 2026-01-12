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
      isConnected: false,
      createdAt: new Date()
    }

    try {
      // Real database connection logic
      if (config.type === 'mysql') {
        const mysql = await import('mysql2/promise')
        connection.client = await mysql.createConnection({
          host: config.host,
          port: config.port || 3306,
          user: config.username,
          password: config.password,
          database: config.database
        })
      } else if (config.type === 'postgresql') {
        const { Client } = await import('pg')
        connection.client = new Client({
          host: config.host,
          port: config.port || 5432,
          user: config.username,
          password: config.password,
          database: config.database
        })
        await connection.client.connect()
      } else if (config.type === 'sqlite') {
        const sqlite3 = await import('sqlite3')
        const { open } = await import('sqlite')
        connection.client = await open({
          filename: config.database,
          driver: sqlite3.Database
        })
      } else if (config.type === 'mongodb') {
        const { MongoClient } = await import('mongodb')
        const uri = `mongodb://${config.username}:${config.password}@${config.host}:${config.port || 27017}/${config.database}`
        connection.client = new MongoClient(uri)
        await connection.client.connect()
      }
      
      connection.isConnected = true
      this.connections.set(id, connection)
      return connection
    } catch (error) {
      throw new Error(`Failed to connect to ${config.type}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async executeQuery(connectionId: string, sql: string): Promise<QueryResult> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) {
      throw new Error('Connection not found or not connected')
    }

    const startTime = Date.now()
    
    try {
      let result: any
      
      if (connection.type === 'mysql') {
        const [rows] = await connection.client.execute(sql)
        result = { rows: Array.isArray(rows) ? rows : [rows], rowCount: Array.isArray(rows) ? rows.length : 1 }
      } else if (connection.type === 'postgresql') {
        const queryResult = await connection.client.query(sql)
        result = { rows: queryResult.rows, rowCount: queryResult.rowCount }
      } else if (connection.type === 'sqlite') {
        if (sql.toLowerCase().startsWith('select')) {
          const rows = await connection.client.all(sql)
          result = { rows, rowCount: rows.length }
        } else {
          const queryResult = await connection.client.run(sql)
          result = { rows: [], rowCount: queryResult.changes || 0 }
        }
      } else if (connection.type === 'mongodb') {
        // For MongoDB, we'd need to parse the query differently
        // This is a simplified example
        const db = connection.client.db(connection.database)
        const collection = db.collection('default')
        const rows = await collection.find({}).toArray()
        result = { rows, rowCount: rows.length }
      }
      
      return {
        ...result,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      throw new Error('Connection not found')
    }
    
    try {
      if (connection.type === 'mysql') {
        await connection.client.end()
      } else if (connection.type === 'postgresql') {
        await connection.client.end()
      } else if (connection.type === 'sqlite') {
        await connection.client.close()
      } else if (connection.type === 'mongodb') {
        await connection.client.close()
      }
    } catch (error) {
      console.warn('Error closing connection:', error)
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

    try {
      let tables: string[] = []
      
      if (connection.type === 'mysql') {
        const [rows] = await connection.client.execute('SHOW TABLES')
        tables = (rows as any[]).map(row => Object.values(row)[0] as string)
      } else if (connection.type === 'postgresql') {
        const result = await connection.client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        tables = result.rows.map((row: any) => row.tablename)
      } else if (connection.type === 'sqlite') {
        const rows = await connection.client.all("SELECT name FROM sqlite_master WHERE type='table'")
        tables = rows.map((row: any) => row.name)
      } else if (connection.type === 'mongodb') {
        const db = connection.client.db(connection.database)
        const collections = await db.listCollections().toArray()
        tables = collections.map((col: any) => col.name)
      }
      
      return tables
    } catch (error) {
      throw new Error(`Failed to get tables: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

const databaseManager = new DatabaseManager()

export const createConnection = (config: any) => databaseManager.createConnection(config)
export const executeQuery = (connectionId: string, sql: string) => databaseManager.executeQuery(connectionId, sql)
export const closeConnection = (connectionId: string) => databaseManager.closeConnection(connectionId)
export const getConnections = () => databaseManager.getConnections()
export const getConnection = (connectionId: string) => databaseManager.getConnection(connectionId)
export const getTables = (connectionId: string) => databaseManager.getTables(connectionId)