// Lazy load AWS SDK modules for better performance
let AWS;
let dynamodb;
let apiGatewayCache = new Map();

// Initialize AWS SDK only when needed
function initializeAWS() {
  if (!AWS) {
    AWS = require('aws-sdk');
    dynamodb = new AWS.DynamoDB.DocumentClient({
      region: process.env.AWS_REGION || 'ap-south-1',
      maxRetries: 3,
      retryDelayOptions: {
        customBackoff: function(retryCount) {
          return Math.pow(2, retryCount) * 100;
        }
      }
    });
  }
  return { AWS, dynamodb };
}

const MAX_LINE_NUMBER = 10000;
const MAX_COLUMN_NUMBER = 1000;
const MAX_STRING_LENGTH = 1000;
const BROADCAST_TIMEOUT = 5000;
const MAX_PAYLOAD_SIZE = 10000;
const CONNECTION_CLEANUP_HOURS = 24;

function secureLog(level, message, data = {}) {
  try {
    const sanitizedData = sanitizeLogData(data);
    const logEntry = {
      level: String(level).toUpperCase(),
      message: String(message).replace(/[\r\n\t]/g, '_').substring(0, 200),
      timestamp: new Date().toISOString(),
      requestId: process.env.AWS_REQUEST_ID || 'unknown',
      data: sanitizedData
    };
    console.log(JSON.stringify(logEntry));
  } catch (error) {
    console.error('Logging failed:', error.message);
  }
}

function sanitizeLogData(data) {
  if (!data || typeof data !== 'object') return {};
  
  const sanitized = { ...data };
  delete sanitized.content;
  if (sanitized.operation?.content) delete sanitized.operation.content;
  
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].replace(/[\r\n\t]/g, '_').substring(0, 100);
    }
  });
  
  return sanitized;
}

function validateInput(data, requiredFields = []) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid input data structure');
  }
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  const sanitized = {};
  const allowedKeys = new Set(['action', 'documentId', 'mode', 'operation', 'cursor', 'type', 'position', 'content', 'length', 'line', 'column']);
  
  Object.keys(data).forEach(key => {
    if (!allowedKeys.has(key)) return;
    
    const value = data[key];
    if (typeof value === 'string') {
      sanitized[key] = value
        .replace(/[<>"'&\x00-\x1f\x7f-\x9f]/g, '')
        .trim()
        .substring(0, MAX_STRING_LENGTH);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[key] = Math.max(-1000000, Math.min(1000000, value));
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = validateInput(value, []);
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
}

function safeJsonParse(jsonString) {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return {};
    }
    
    if (jsonString.length > MAX_PAYLOAD_SIZE) {
      throw new Error('JSON payload exceeds size limit');
    }
    
    const parsed = JSON.parse(jsonString);
    
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Invalid JSON structure - must be object');
    }
    
    return parsed;
  } catch (error) {
    secureLog('ERROR', 'JSON parsing failed', { error: error.message, size: jsonString?.length });
    throw new Error('Invalid JSON format');
  }
}

function safeJsonStringify(obj) {
  try {
    if (obj === null || obj === undefined) {
      return JSON.stringify({});
    }
    
    const result = JSON.stringify(obj);
    if (result.length > MAX_PAYLOAD_SIZE) {
      throw new Error('Serialized object too large');
    }
    
    return result;
  } catch (error) {
    secureLog('ERROR', 'JSON stringification failed', { error: error.message });
    throw new Error('Failed to serialize message');
  }
}

function getApiGateway(event) {
  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  
  if (!apiGatewayCache.has(endpoint)) {
    const { AWS } = initializeAWS();
    apiGatewayCache.set(endpoint, new AWS.ApiGatewayManagementApi({ endpoint }));
  }
  
  return apiGatewayCache.get(endpoint);
}

exports.handler = async (event) => {
  const startTime = Date.now();
  let connectionId;
  
  try {
    connectionId = event.requestContext?.connectionId;
    if (!connectionId || typeof connectionId !== 'string') {
      secureLog('ERROR', 'Invalid connection ID');
      return { statusCode: 400, body: safeJsonStringify({ error: 'Bad Request' }) };
    }
    
    const body = safeJsonParse(event.body);
    const sanitizedBody = validateInput(body, ['action']);
    
    secureLog('INFO', 'Processing message', { connectionId, action: sanitizedBody.action });
    
    const apigateway = getApiGateway(event);
    
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
    secureLog('ERROR', 'Request failed', { 
      connectionId: connectionId || 'unknown',
      error: error.message, 
      duration 
    });
    return { statusCode: 500, body: safeJsonStringify({ error: 'Internal server error' }) };
  }
};

async function handleJoinDocument(connectionId, data, apigateway) {
  try {
    const { dynamodb } = initializeAWS();
    const validatedData = validateInput(data, ['documentId', 'mode']);
    const { documentId, mode } = validatedData;
    
    if (!['solo', 'live'].includes(mode)) {
      throw new Error('Invalid collaboration mode');
    }
    
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(documentId)) {
      throw new Error('Invalid document ID format');
    }
    
    secureLog('INFO', 'Join document request', { connectionId, documentId, mode });
    
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
      },
      ReturnValues: 'UPDATED_NEW'
    };
    
    await dynamodb.update(updateParams).promise();
    secureLog('INFO', 'Connection updated', { connectionId, documentId });
    
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
    
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(documentId)) {
      throw new Error('Invalid document ID format');
    }
    
    secureLog('INFO', 'Processing operation', { connectionId, documentId, type: validatedOperation.type });
    
    try {
      await persistOperationToDocument(documentId, validatedOperation);
      secureLog('INFO', 'Operation persisted', { documentId, operationType: validatedOperation.type });
    } catch (persistError) {
      secureLog('ERROR', 'Persistence failed', { documentId, error: persistError.message });
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

async function persistOperationToDocument(documentId, operation) {
  try {
    const { dynamodb } = initializeAWS();
    
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(documentId)) {
      throw new Error('Invalid document ID for persistence');
    }
    
    const getParams = {
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { id: documentId },
      ProjectionExpression: 'content, version'
    };
    
    const doc = await dynamodb.get(getParams).promise();
    let currentContent = doc.Item?.content || '';
    let currentVersion = doc.Item?.version || 0;
    
    let newContent = currentContent;
    if (operation.type === 'insert' && operation.content && typeof operation.position === 'number') {
      const pos = Math.max(0, Math.min(operation.position, currentContent.length));
      const safeContent = String(operation.content).substring(0, 10000);
      newContent = currentContent.slice(0, pos) + safeContent + currentContent.slice(pos);
    } else if (operation.type === 'delete' && typeof operation.position === 'number' && typeof operation.length === 'number') {
      const start = Math.max(0, Math.min(operation.position, currentContent.length));
      const end = Math.max(start, Math.min(start + Math.abs(operation.length), currentContent.length));
      newContent = currentContent.slice(0, start) + currentContent.slice(end);
    }
    
    const updateParams = {
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { id: documentId },
      UpdateExpression: 'SET content = :content, version = :version, lastModified = :lastModified',
      ExpressionAttributeValues: {
        ':content': newContent,
        ':version': currentVersion + 1,
        ':lastModified': Date.now()
      },
      ReturnValues: 'UPDATED_NEW'
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

async function getDocumentConnections(documentId) {
  try {
    const { dynamodb } = initializeAWS();
    
    if (!documentId || typeof documentId !== 'string' || !/^[a-zA-Z0-9_-]{1,50}$/.test(documentId)) {
      throw new Error('Invalid document ID for connection lookup');
    }
    
    const cutoffTime = Date.now() - (CONNECTION_CLEANUP_HOURS * 60 * 60 * 1000);
    
    const queryParams = {
      TableName: process.env.CONNECTIONS_TABLE,
      IndexName: 'DocumentIdIndex',
      KeyConditionExpression: 'documentId = :docId',
      FilterExpression: '#modeAttr = :mode AND lastActivity > :cutoff',
      ExpressionAttributeNames: { '#modeAttr': 'mode' },
      ExpressionAttributeValues: {
        ':docId': documentId,
        ':mode': 'live',
        ':cutoff': cutoffTime
      },
      ProjectionExpression: 'connectionId, documentId, #modeAttr, joinedAt, lastActivity',
      Limit: 100
    };
    
    let result;
    try {
      result = await dynamodb.query(queryParams).promise();
      secureLog('INFO', 'Retrieved connections via query', { documentId, count: result.Items?.length || 0 });
    } catch (queryError) {
      secureLog('WARN', 'Query failed, using scan', { documentId, error: queryError.message });
      
      const scanParams = {
        TableName: process.env.CONNECTIONS_TABLE,
        FilterExpression: 'documentId = :docId AND #modeAttr = :mode AND lastActivity > :cutoff',
        ExpressionAttributeNames: { '#modeAttr': 'mode' },
        ExpressionAttributeValues: {
          ':docId': documentId,
          ':mode': 'live',
          ':cutoff': cutoffTime
        },
        ProjectionExpression: 'connectionId, documentId, #modeAttr, joinedAt, lastActivity',
        Limit: 100
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

async function broadcastToConnections(connections, message, apigateway) {
  if (!Array.isArray(connections) || connections.length === 0) {
    return { successful: 0, failed: 0 };
  }
  
  secureLog('INFO', 'Broadcasting message', { connectionCount: connections.length, messageType: message.type });
  
  const promises = connections.slice(0, 50).map(async (connection) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Broadcast timeout')), BROADCAST_TIMEOUT);
    });
    
    const sendPromise = sendToConnection(connection.connectionId, message, apigateway)
      .then(() => ({ success: true, connectionId: connection.connectionId }))
      .catch(error => ({ success: false, connectionId: connection.connectionId, error: error.message }));
    
    try {
      return await Promise.race([sendPromise, timeoutPromise]);
    } catch (error) {
      secureLog('WARN', 'Broadcast timeout', { connectionId: connection.connectionId, error: error.message });
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

async function cleanupStaleConnection(connectionId) {
  try {
    const { dynamodb } = initializeAWS();
    
    if (!connectionId || typeof connectionId !== 'string' || connectionId.length > 100) {
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