const AWS = require('aws-sdk');

// Constants for validation
const MAX_LINE_NUMBER = 10000;
const MAX_COLUMN_NUMBER = 1000;
const MAX_STRING_LENGTH = 1000;
const BROADCAST_TIMEOUT = 5000; // 5 seconds timeout for broadcasts

// Initialize DynamoDB client with proper configuration
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  maxRetries: 3,
  retryDelayOptions: {
    customBackoff: function(retryCount) {
      return Math.pow(2, retryCount) * 100;
    }
  }
});

// Secure logging utility
function secureLog(level, message, data = {}) {
  const sanitizedData = { ...data };
  // Remove sensitive content from logs
  if (sanitizedData.content) delete sanitizedData.content;
  if (sanitizedData.operation?.content) delete sanitizedData.operation.content;
  
  console.log(JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId: process.env.AWS_REQUEST_ID,
    data: sanitizedData
  }));
}

// Enhanced input validation and sanitization
function validateInput(data, requiredFields = []) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input data');
  }
  
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  const sanitized = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (typeof value === 'string') {
      sanitized[key] = value
        .replace(/[<>\"'&\x00-\x1f\x7f-\x9f]/g, '')
        .trim()
        .substring(0, MAX_STRING_LENGTH);
    } else if (typeof value === 'number' && isFinite(value)) {
      sanitized[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Fix: Pass empty array for nested objects to maintain function signature
      sanitized[key] = validateInput(value, []);
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
}

// Safe JSON parsing with validation
function safeJsonParse(jsonString) {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return {};
    }
    
    // Additional validation for JSON structure
    if (jsonString.length > 10000) {
      throw new Error('JSON payload too large');
    }
    
    const parsed = JSON.parse(jsonString);
    
    // Validate parsed object structure
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid JSON structure');
    }
    
    return parsed;
  } catch (error) {
    secureLog('ERROR', 'JSON parsing failed', { error: error.message });
    throw new Error('Invalid JSON format');
  }
}

// Safe JSON stringification
function safeJsonStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    secureLog('ERROR', 'JSON stringification failed', { error: error.message });
    throw new Error('Failed to serialize message');
  }
}

exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    const connectionId = event.requestContext?.connectionId;
    if (!connectionId) {
      secureLog('ERROR', 'Missing connection ID');
      return { statusCode: 400, body: safeJsonStringify({ error: 'Bad Request' }) };
    }
    
    // Safe JSON parsing with enhanced validation
    const body = safeJsonParse(event.body);
    const sanitizedBody = validateInput(body, ['action']);
    
    secureLog('INFO', 'Processing message', { connectionId, action: sanitizedBody.action });
    
    const apigateway = new AWS.ApiGatewayManagementApi({
      endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`
    });
    
    let result;
    switch (sanitizedBody.action) {
      case 'join-document':
        result = await handleJoinDocument(connectionId, sanitizedBody, apigateway);
        break;
      case 'operation':
        result = await handleOperation(connectionId, sanitizedBody, apigateway);
        break;
      case 'cursor-update':
        result = await handleCursorUpdate(connectionId, sanitizedBody, apigateway);
        break;
      default:
        secureLog('WARN', 'Unknown action', { connectionId, action: sanitizedBody.action });
        return { statusCode: 400, body: safeJsonStringify({ error: 'Unknown action' }) };
    }
    
    const duration = Date.now() - startTime;
    secureLog('INFO', 'Request completed', { connectionId, duration });
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    secureLog('ERROR', 'Request failed', { error: error.message, duration });
    return { statusCode: 500, body: safeJsonStringify({ error: 'Internal server error' }) };
  }
};

async function handleJoinDocument(connectionId, data, apigateway) {
  try {
    const validatedData = validateInput(data, ['documentId', 'mode']);
    const { documentId, mode } = validatedData;
    
    if (!['solo', 'live'].includes(mode)) {
      throw new Error('Invalid mode');
    }
    
    secureLog('INFO', 'Join document request', { connectionId, documentId, mode });
    
    // Use parameterized update with expression attribute names
    const updateParams = {
      TableName: process.env.CONNECTIONS_TABLE,
      Key: { connectionId },
      UpdateExpression: 'SET documentId = :docId, #modeAttr = :mode, joinedAt = :joinedAt, lastActivity = :lastActivity',
      ExpressionAttributeNames: { '#modeAttr': 'mode' },
      ExpressionAttributeValues: {
        ':docId': documentId,
        ':mode': mode,
        ':joinedAt': Date.now(),
        ':lastActivity': Date.now()
      }
    };
    
    await dynamodb.update(updateParams).promise();
    secureLog('INFO', 'Connection updated', { connectionId, documentId });
    
    // Get document content safely
    try {
      const getParams = {
        TableName: process.env.DOCUMENTS_TABLE,
        Key: { id: documentId },
        ProjectionExpression: 'id, content, version, language, lastModified'
      };
      
      const doc = await dynamodb.get(getParams).promise();
      
      if (doc.Item) {
        await sendToConnection(connectionId, {
          type: 'document-content',
          data: {
            content: doc.Item.content || '',
            version: doc.Item.version || 0,
            language: doc.Item.language || 'javascript',
            lastModified: doc.Item.lastModified || Date.now()
          }
        }, apigateway);
      }
    } catch (docError) {
      secureLog('WARN', 'Document fetch failed', { documentId, error: docError.message });
    }
    
    // Notify other users in live mode
    if (mode === 'live') {
      const connections = await getDocumentConnections(documentId);
      const otherConnections = connections.filter(c => c.connectionId !== connectionId);
      
      if (otherConnections.length > 0) {
        await broadcastToConnections(otherConnections, {
          type: 'user-joined',
          data: { connectionId, timestamp: Date.now() }
        }, apigateway);
      }
      
      secureLog('INFO', 'Notified users', { documentId, count: otherConnections.length });
    }
    
    return { statusCode: 200, body: safeJsonStringify({ success: true }) };
    
  } catch (error) {
    secureLog('ERROR', 'Join document failed', { connectionId, error: error.message });
    return { statusCode: 500, body: safeJsonStringify({ error: 'Join failed' }) };
  }
}

async function handleOperation(connectionId, data, apigateway) {
  try {
    const validatedData = validateInput(data, ['documentId', 'operation']);
    const { documentId, operation } = validatedData;
    
    const validatedOperation = validateInput(operation, ['type']);
    if (!['insert', 'delete', 'replace'].includes(validatedOperation.type)) {
      throw new Error('Invalid operation type');
    }
    
    secureLog('INFO', 'Processing operation', { connectionId, documentId, type: validatedOperation.type });
    
    // CRITICAL FIX: Persist operation to document in database
    try {
      await persistOperationToDocument(documentId, validatedOperation);
      secureLog('INFO', 'Operation persisted to document', { documentId, operationType: validatedOperation.type });
    } catch (persistError) {
      secureLog('ERROR', 'Failed to persist operation', { documentId, error: persistError.message });
      // Continue with broadcast even if persistence fails to maintain real-time collaboration
    }
    
    const connections = await getDocumentConnections(documentId);
    const otherConnections = connections.filter(c => c.connectionId !== connectionId);
    
    if (otherConnections.length > 0) {
      await broadcastToConnections(otherConnections, {
        type: 'operation',
        operation: validatedOperation,
        timestamp: Date.now(),
        sourceConnection: connectionId
      }, apigateway);
    }
    
    await sendToConnection(connectionId, {
      type: 'operation-confirmed',
      data: { 
        operation: validatedOperation,
        timestamp: Date.now()
      }
    }, apigateway);
    
    secureLog('INFO', 'Operation processed', { connectionId, documentId, broadcastCount: otherConnections.length });
    return { statusCode: 200, body: safeJsonStringify({ success: true }) };
    
  } catch (error) {
    secureLog('ERROR', 'Operation failed', { connectionId, error: error.message });
    return { statusCode: 500, body: safeJsonStringify({ error: 'Operation failed' }) };
  }
}

// New function to persist operations to document
async function persistOperationToDocument(documentId, operation) {
  try {
    // Get current document
    const getParams = {
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { id: documentId }
    };
    
    const doc = await dynamodb.get(getParams).promise();
    let currentContent = doc.Item?.content || '';
    let currentVersion = doc.Item?.version || 0;
    
    // Apply operation to content
    let newContent = currentContent;
    if (operation.type === 'insert' && operation.content && typeof operation.position === 'number') {
      const pos = Math.max(0, Math.min(operation.position, currentContent.length));
      newContent = currentContent.slice(0, pos) + operation.content + currentContent.slice(pos);
    } else if (operation.type === 'delete' && typeof operation.position === 'number' && typeof operation.length === 'number') {
      const start = Math.max(0, Math.min(operation.position, currentContent.length));
      const end = Math.max(start, Math.min(start + operation.length, currentContent.length));
      newContent = currentContent.slice(0, start) + currentContent.slice(end);
    }
    
    // Update document with new content and version
    const updateParams = {
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { id: documentId },
      UpdateExpression: 'SET content = :content, version = :version, lastModified = :lastModified',
      ExpressionAttributeValues: {
        ':content': newContent,
        ':version': currentVersion + 1,
        ':lastModified': Date.now()
      }
    };
    
    await dynamodb.update(updateParams).promise();
    
  } catch (error) {
    secureLog('ERROR', 'Document persistence failed', { documentId, error: error.message });
    throw error;
  }
}

async function handleCursorUpdate(connectionId, data, apigateway) {
  try {
    const validatedData = validateInput(data, ['documentId', 'cursor']);
    const { documentId, cursor } = validatedData;
    
    const validatedCursor = validateInput(cursor, ['line', 'column']);
    if (typeof validatedCursor.line !== 'number' || typeof validatedCursor.column !== 'number') {
      throw new Error('Invalid cursor data');
    }
    
    // Use named constants for bounds validation
    if (validatedCursor.line < 1 || validatedCursor.column < 1 || 
        validatedCursor.line > MAX_LINE_NUMBER || validatedCursor.column > MAX_COLUMN_NUMBER) {
      throw new Error('Cursor position out of bounds');
    }
    
    secureLog('INFO', 'Processing cursor update', { connectionId, documentId });
    
    const connections = await getDocumentConnections(documentId);
    const otherConnections = connections.filter(c => c.connectionId !== connectionId);
    
    if (otherConnections.length > 0) {
      await broadcastToConnections(otherConnections, {
        type: 'cursor-update',
        userId: connectionId,
        cursor: validatedCursor,
        timestamp: Date.now()
      }, apigateway);
    }
    
    secureLog('INFO', 'Cursor update processed', { connectionId, documentId, broadcastCount: otherConnections.length });
    return { statusCode: 200, body: safeJsonStringify({ success: true }) };
    
  } catch (error) {
    secureLog('ERROR', 'Cursor update failed', { connectionId, error: error.message });
    return { statusCode: 500, body: safeJsonStringify({ error: 'Cursor update failed' }) };
  }
}

// PERFORMANCE FIX: Use query instead of scan for better performance
async function getDocumentConnections(documentId) {
  try {
    if (!documentId || typeof documentId !== 'string') {
      throw new Error('Invalid document ID');
    }
    
    // Use query with GSI for better performance (requires GSI on documentId)
    // If GSI doesn't exist, fall back to scan but with better filtering
    const queryParams = {
      TableName: process.env.CONNECTIONS_TABLE,
      IndexName: 'DocumentIdIndex', // Assumes GSI exists
      KeyConditionExpression: 'documentId = :docId',
      FilterExpression: '#modeAttr = :mode AND lastActivity > :cutoff',
      ExpressionAttributeNames: { '#modeAttr': 'mode' },
      ExpressionAttributeValues: {
        ':docId': documentId,
        ':mode': 'live',
        ':cutoff': Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
      },
      ProjectionExpression: 'connectionId, documentId, #modeAttr, joinedAt, lastActivity'
    };
    
    let result;
    try {
      // Try query first (requires GSI)
      result = await dynamodb.query(queryParams).promise();
      secureLog('INFO', 'Retrieved connections via query', { documentId, count: result.Items?.length || 0 });
    } catch (queryError) {
      // Fallback to scan if GSI doesn't exist
      secureLog('WARN', 'Query failed, falling back to scan', { documentId, error: queryError.message });
      
      const scanParams = {
        TableName: process.env.CONNECTIONS_TABLE,
        FilterExpression: 'documentId = :docId AND #modeAttr = :mode AND lastActivity > :cutoff',
        ExpressionAttributeNames: { '#modeAttr': 'mode' },
        ExpressionAttributeValues: {
          ':docId': documentId,
          ':mode': 'live',
          ':cutoff': Date.now() - (24 * 60 * 60 * 1000)
        },
        ProjectionExpression: 'connectionId, documentId, #modeAttr, joinedAt, lastActivity'
      };
      
      result = await dynamodb.scan(scanParams).promise();
      secureLog('INFO', 'Retrieved connections via scan', { documentId, count: result.Items?.length || 0 });
    }
    
    return result.Items || [];
    
  } catch (error) {
    secureLog('ERROR', 'Failed to get connections', { documentId, error: error.message });
    return [];
  }
}

// PERFORMANCE FIX: Add timeout to broadcast operations
async function broadcastToConnections(connections, message, apigateway) {
  if (!connections || connections.length === 0) {
    return { successful: 0, failed: 0 };
  }
  
  secureLog('INFO', 'Broadcasting message', { connectionCount: connections.length, messageType: message.type });
  
  // Add timeout to prevent slow connections from blocking
  const promises = connections.map(async (connection) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Broadcast timeout')), BROADCAST_TIMEOUT);
    });
    
    const sendPromise = sendToConnection(connection.connectionId, message, apigateway)
      .then(() => ({ success: true, connectionId: connection.connectionId }))
      .catch(error => ({ success: false, connectionId: connection.connectionId, error: error.message }));
    
    try {
      return await Promise.race([sendPromise, timeoutPromise]);
    } catch (error) {
      secureLog('WARN', 'Broadcast timeout or failed', { connectionId: connection.connectionId, error: error.message });
      return { success: false, connectionId: connection.connectionId, error: error.message };
    }
  });
  
  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;
  
  secureLog('INFO', 'Broadcast completed', { total: connections.length, successful, failed });
  return { successful, failed };
}

async function sendToConnection(connectionId, message, apigateway) {
  try {
    if (!connectionId || typeof connectionId !== 'string') {
      throw new Error('Invalid connection ID');
    }
    
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message object');
    }
    
    // Safe JSON stringification with error handling
    const messageData = safeJsonStringify(message);
    
    secureLog('DEBUG', 'Sending message', { connectionId, messageType: message.type, size: messageData.length });
    
    await apigateway.postToConnection({
      ConnectionId: connectionId,
      Data: messageData
    }).promise();
    
    secureLog('DEBUG', 'Message sent', { connectionId });
    
  } catch (error) {
    secureLog('ERROR', 'Send failed', { connectionId, error: error.message });
    
    if (error.statusCode === 410) {
      await cleanupStaleConnection(connectionId);
    }
    
    throw error;
  }
}

// FIX: Add input validation to cleanup function
async function cleanupStaleConnection(connectionId) {
  try {
    // Add input validation
    if (!connectionId || typeof connectionId !== 'string') {
      throw new Error('Invalid connection ID for cleanup');
    }
    
    const deleteParams = {
      TableName: process.env.CONNECTIONS_TABLE,
      Key: { connectionId },
      ReturnValues: 'ALL_OLD'
    };
    
    const result = await dynamodb.delete(deleteParams).promise();
    secureLog('INFO', 'Stale connection cleaned', { 
      connectionId, 
      wasDeleted: !!result.Attributes 
    });
    
  } catch (error) {
    secureLog('ERROR', 'Cleanup failed', { connectionId, error: error.message });
  }
}