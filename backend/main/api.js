const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();

// In-memory database connections for demo
const connections = new Map();

exports.handler = async (event) => {
  const { httpMethod, path, body, pathParameters } = event;

  try {
    switch (`${httpMethod} ${path}`) {
      case 'GET /health':
        return response(200, { status: 'healthy', timestamp: new Date().toISOString() });
      
      case 'POST /api/documents':
        return await createDocument(JSON.parse(body));
      
      case 'GET /api/documents':
        return await listDocuments();
      
      case 'POST /api/database':
        return await handleDatabaseRequest(JSON.parse(body));
      
      case 'GET /api/database':
        return await handleDatabaseGet(event.queryStringParameters);
      
      default:
        if (httpMethod === 'GET' && path.startsWith('/api/documents/')) {
          const documentId = pathParameters.proxy;
          return await getDocument(documentId);
        }
        return response(404, { error: 'Not found' });
    }
  } catch (error) {
    console.error('API error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

async function handleDatabaseRequest(data) {
  const { action } = data;
  
  switch (action) {
    case 'connect':
      const { host, port, database, username, password, type } = data;
      if (!host || !database || !username || !type) {
        return response(400, { success: false, error: 'Missing required fields' });
      }
      
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      connections.set(connectionId, {
        id: connectionId,
        type,
        host,
        port,
        database,
        username,
        isConnected: true,
        createdAt: new Date()
      });
      
      return response(200, {
        success: true,
        connectionId,
        message: 'Connected successfully'
      });
    
    case 'query':
      const { connectionId, sql } = data;
      if (!connectionId || !sql) {
        return response(400, { success: false, error: 'Connection ID and SQL required' });
      }
      
      const connection = connections.get(connectionId);
      if (!connection) {
        return response(400, { success: false, error: 'Connection not found' });
      }
      
      const startTime = Date.now();
      
      // Mock query results
      const mockRows = sql.toLowerCase().includes('select') ? [
        { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-16' }
      ] : [];
      
      return response(200, {
        success: true,
        data: mockRows,
        rowCount: mockRows.length,
        executionTime: Date.now() - startTime
      });
    
    case 'disconnect':
      const { connectionId: disconnectId } = data;
      if (!disconnectId) {
        return response(400, { success: false, error: 'Connection ID required' });
      }
      
      connections.delete(disconnectId);
      return response(200, {
        success: true,
        message: 'Disconnected successfully'
      });
    
    default:
      return response(400, { success: false, error: 'Invalid action' });
  }
}

async function handleDatabaseGet(params) {
  const action = params?.action;
  
  switch (action) {
    case 'connections':
      return response(200, {
        success: true,
        connections: Array.from(connections.values())
      });
    
    case 'tables':
      const connectionId = params?.connectionId;
      if (!connectionId) {
        return response(400, { success: false, error: 'Connection ID required' });
      }
      return response(200, {
        success: true,
        tables: ['users', 'products', 'orders']
      });
    
    default:
      return response(400, { success: false, error: 'Invalid action' });
  }
}

async function createDocument(data) {
  const documentId = uuidv4();
  const { name, content = '', language = 'javascript', userId } = data;
  
  const document = {
    documentId,
    name,
    content,
    language,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 0
  };

  await dynamodb.put({
    TableName: 'kriya-documents',
    Item: document
  }).promise();

  return response(201, document);
}

async function getDocument(documentId) {
  const result = await dynamodb.get({
    TableName: 'kriya-documents',
    Key: { documentId }
  }).promise();

  if (!result.Item) {
    return response(404, { error: 'Document not found' });
  }

  return response(200, result.Item);
}

async function listDocuments() {
  const result = await dynamodb.scan({
    TableName: 'kriya-documents'
  }).promise();

  return response(200, { documents: result.Items });
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}