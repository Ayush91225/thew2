import { NextRequest, NextResponse } from 'next/server'
import { getTables, createConnection, executeQuery as runQuery, closeConnection } from '@/lib/database-manager'

const handleError = (message: string, status = 500) => 
  NextResponse.json({ success: false, error: message }, { status })

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'connections':
        const { getConnections } = await import('@/lib/database-manager')
        return NextResponse.json({ success: true, connections: getConnections() })

      case 'tables':
        const connectionId = searchParams.get('connectionId')
        if (!connectionId) return handleError('Connection ID required', 400)
        
        try {
          const tables = await getTables(connectionId)
          return NextResponse.json({ success: true, tables })
        } catch {
          return handleError('Failed to get tables')
        }

      default:
        return handleError('Invalid action', 400)
    }
  } catch {
    return handleError('Request failed')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'connect':
        const { host, port, database, username, password, type } = body
        if (!host || !database || !username || !type) {
          return handleError('Missing required fields', 400)
        }
        return NextResponse.json(await testConnection({ host, port, database, username, password, type }))

      case 'query':
        const { connectionId, sql } = body
        if (!connectionId || !sql) {
          return handleError('Connection ID and SQL required', 400)
        }
        return NextResponse.json(await executeQuery(connectionId, sql))

      case 'disconnect':
        const { connectionId: disconnectId } = body
        if (!disconnectId) {
          return handleError('Connection ID required', 400)
        }
        return NextResponse.json(await disconnectDatabase(disconnectId))

      default:
        return handleError('Invalid action', 400)
    }
  } catch {
    return handleError('Request failed')
  }
}

async function testConnection(config: any) {
  try {
    const connection = await createConnection(config)
    return { success: true, connectionId: connection.id, message: 'Connected successfully' }
  } catch {
    return { success: false, error: 'Connection failed' }
  }
}

async function executeQuery(connectionId: string, sql: string) {
  try {
    const result = await runQuery(connectionId, sql)
    return { success: true, data: result.rows, rowCount: result.rowCount, executionTime: result.executionTime }
  } catch {
    return { success: false, error: 'Query execution failed' }
  }
}

async function disconnectDatabase(connectionId: string) {
  try {
    await closeConnection(connectionId)
    return { success: true, message: 'Disconnected successfully' }
  } catch {
    return { success: false, error: 'Disconnect failed' }
  }
}