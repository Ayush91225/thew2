const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// Configure AWS clients with proper error handling
const dynamodb = new AWS.DynamoDB.DocumentClient();
const apiGateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

// Secure logging with sanitization
const log = (level, message, data = {}) => {
  const sanitizedData = sanitizeLogData(data);
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message: validator.escape(message),
    data: sanitizedData,
    requestId: process.env.AWS_REQUEST_ID
  }));
};

const sanitizeLogData = (data) => {
  if (typeof data === 'string') {
    return validator.escape(data);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[validator.escape(key)] = typeof value === 'string' ? validator.escape(value) : value;
    }
    return sanitized;
  }
  return data;
};

// Secure JSON parsing
const parseSecureJSON = (data) => {
  if (typeof data !== 'string' || data.length > 10000) {
    throw new Error('Invalid message size');
  }
  return JSON.parse(data);
};

exports.handler = async (event) => {
  const { requestContext, body } = event;
  const { connectionId, routeKey } = requestContext;

  try {
    switch (routeKey) {
      case '$connect':
        return await handleConnect(connectionId, event);
      case '$disconnect':
        return await handleDisconnect(connectionId);
      case 'join-document':
        return await handleJoinDocument(connectionId, parseSecureJSON(body || '{}'));
      case 'operation':
        return await handleOperation(connectionId, parseSecureJSON(body || '{}'));
      case 'cursor-update':
        return await handleCursorUpdate(connectionId, parseSecureJSON(body || '{}'));
      case '$default':
        const message = parseSecureJSON(body || '{}');
        switch (message.action) {
          case 'join-document':
            return await handleJoinDocument(connectionId, message);
          case 'operation':
            return await handleOperation(connectionId, message);
          case 'cursor-update':
            return await handleCursorUpdate(connectionId, message);
          default:
            return { statusCode: 400, body: 'Unknown action' };
        }
      default:
        return { statusCode: 400, body: 'Unknown route' };
    }
  } catch (error) {
    log('ERROR', 'Handler error', { error: error.message });
    return { statusCode: 500, body: 'Internal server error' };
  }
};

async function handleConnect(connectionId, event) {
  try {
    const token = event.queryStringParameters?.token;
    
    if (!token || typeof token !== 'string' || token.length > 2000) {
      return { statusCode: 401, body: 'Invalid token' };
    }

    let decoded;
    if (!process.env.JWT_SECRET) {
      return { statusCode: 500, body: 'Server configuration error' };
    }

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      try {
        const decodedStr = Buffer.from(token, 'base64').toString('utf8');
        if (decodedStr.length > 1000) {
          throw new Error('Token too large');
        }
        decoded = parseSecureJSON(decodedStr);
      } catch (base64Error) {
        return { statusCode: 401, body: 'Invalid token' };
      }
    }
    
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      return { statusCode: 401, body: 'Invalid token' };
    }
    
    const sanitizedUserId = validator.escape(decoded.userId.substring(0, 50));
    const sanitizedUserInfo = {
      userId: sanitizedUserId,
      name: validator.escape((decoded.name || 'Anonymous').substring(0, 50)),
      avatar: validator.isURL(decoded.avatar || '') ? decoded.avatar : ''
    };
    
    await dynamodb.put({
      TableName: 'kriya-sessions',
      Item: {
        sessionId: connectionId,
        userId: sanitizedUserId,
        userInfo: sanitizedUserInfo,
        connectedAt: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + 86400
      }
    }).promise();

    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    log('ERROR', 'Connect error', { error: error.message });
    return { statusCode: 500, body: 'Connection failed' };
  }
}

async function handleDisconnect(connectionId) {
  try {
    await dynamodb.delete({
      TableName: 'kriya-sessions',
      Key: { sessionId: connectionId }
    }).promise();
    
    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    log('ERROR', 'Disconnect error', { error: error.message });
    return { statusCode: 500, body: 'Disconnect failed' };
  }
}

async function handleJoinDocument(connectionId, data) {
  try {
    const { documentId, mode } = data;
    
    if (!documentId || typeof documentId !== 'string' || documentId.length === 0 || documentId.length > 100) {
      return { statusCode: 400, body: 'Invalid document ID' };
    }
    
    if (!mode || !['solo', 'live'].includes(mode)) {
      return { statusCode: 400, body: 'Invalid mode' };
    }
    
    const session = await dynamodb.get({
      TableName: 'kriya-sessions',
      Key: { sessionId: connectionId }
    }).promise();

    if (!session.Item) {
      return { statusCode: 401, body: 'Session not found' };
    }

    if (mode === 'solo') {
      await sendToConnection(connectionId, {
        type: 'document-joined',
        data: { documentId, mode: 'solo', content: '' }
      });
      return { statusCode: 200, body: 'Joined solo mode' };
    }

    // Store document session
    await dynamodb.put({
      TableName: 'kriya-document-sessions',
      Item: {
        documentId,
        sessionId: connectionId,
        userId: session.Item.userId,
        joinedAt: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + 86400
      }
    }).promise();

    // Get all users in this document
    const documentSessions = await dynamodb.query({
      TableName: 'kriya-document-sessions',
      IndexName: 'DocumentIndex',
      KeyConditionExpression: 'documentId = :docId',
      ExpressionAttributeValues: {
        ':docId': documentId
      }
    }).promise();

    const users = [];
    for (const docSession of documentSessions.Items || []) {
      const userSession = await dynamodb.get({
        TableName: 'kriya-sessions',
        Key: { sessionId: docSession.sessionId }
      }).promise();
      
      if (userSession.Item) {
        users.push({
          id: userSession.Item.userId,
          name: userSession.Item.userInfo?.name || userSession.Item.userId,
          avatar: userSession.Item.userInfo?.avatar || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(userSession.Item.userId)}`
        });
      }
    }

    await sendToConnection(connectionId, {
      type: 'document-joined',
      data: { documentId, mode: 'live', users }
    });
    
    return { statusCode: 200, body: 'Joined live mode' };
  } catch (error) {
    log('ERROR', 'Join error', { error: error.message });
    return { statusCode: 500, body: 'Join failed' };
  }
}

async function handleOperation(connectionId, data) {
  try {
    const { documentId, operation } = data;
    
    if (!documentId || typeof documentId !== 'string' || documentId.length === 0 || documentId.length > 100) {
      return { statusCode: 400, body: 'Invalid document ID' };
    }
    
    if (!operation || !['insert', 'delete'].includes(operation.type)) {
      return { statusCode: 400, body: 'Invalid operation' };
    }
    
    const session = await dynamodb.get({
      TableName: 'kriya-sessions',
      Key: { sessionId: connectionId }
    }).promise();

    if (!session.Item) {
      return { statusCode: 401, body: 'Session not found' };
    }

    const sanitizedOperation = {
      type: operation.type,
      position: Math.max(0, Math.min(operation.position || 0, 1000000)),
      content: operation.content ? validator.escape(operation.content.substring(0, 10000)) : undefined,
      length: operation.length ? Math.max(0, Math.min(operation.length, 10000)) : undefined,
      range: operation.range ? {
        startLine: Math.max(1, operation.range.startLine || 1),
        startColumn: Math.max(1, operation.range.startColumn || 1),
        endLine: Math.max(1, operation.range.endLine || 1),
        endColumn: Math.max(1, operation.range.endColumn || 1)
      } : undefined
    };

    // Get all sessions for this document
    const documentSessions = await dynamodb.query({
      TableName: 'kriya-document-sessions',
      IndexName: 'DocumentIndex',
      KeyConditionExpression: 'documentId = :docId',
      ExpressionAttributeValues: {
        ':docId': documentId
      }
    }).promise();

    const broadcastPromises = (documentSessions.Items || [])
      .filter(item => item.sessionId !== connectionId)
      .map(async (item) => {
        try {
          await sendToConnection(item.sessionId, {
            type: 'operation',
            data: {
              operation: {
                ...sanitizedOperation,
                userId: session.Item.userId,
                timestamp: Date.now()
              },
              documentId
            }
          });
        } catch (error) {
          log('WARN', 'Broadcast failed', { sessionId: item.sessionId });
        }
      });

    await Promise.allSettled(broadcastPromises);

    await sendToConnection(connectionId, {
      type: 'operation-confirmed',
      data: { operation: sanitizedOperation }
    });
    
    return { statusCode: 200, body: 'Operation processed' };
  } catch (error) {
    log('ERROR', 'Operation error', { error: error.message });
    return { statusCode: 500, body: 'Operation failed' };
  }
}

async function handleCursorUpdate(connectionId, data) {
  try {
    const { documentId, cursor } = data;
    
    if (!documentId || typeof documentId !== 'string' || documentId.length === 0 || documentId.length > 100) {
      return { statusCode: 400, body: 'Invalid document ID' };
    }
    
    if (!cursor || typeof cursor.line !== 'number' || typeof cursor.column !== 'number') {
      return { statusCode: 400, body: 'Invalid cursor data' };
    }
    
    const sanitizedCursor = {
      line: Math.max(0, Math.min(cursor.line, 1000000)),
      column: Math.max(0, Math.min(cursor.column, 1000000))
    };
    
    const session = await dynamodb.get({
      TableName: 'kriya-sessions',
      Key: { sessionId: connectionId }
    }).promise();

    if (!session.Item) {
      return { statusCode: 401, body: 'Session not found' };
    }

    // Get all sessions for this document
    const documentSessions = await dynamodb.query({
      TableName: 'kriya-document-sessions',
      IndexName: 'DocumentIndex',
      KeyConditionExpression: 'documentId = :docId',
      ExpressionAttributeValues: {
        ':docId': documentId
      }
    }).promise();

    const broadcastPromises = (documentSessions.Items || [])
      .filter(item => item.sessionId !== connectionId)
      .map(async (item) => {
        try {
          await sendToConnection(item.sessionId, {
            type: 'cursor-update',
            data: {
              userId: session.Item.userId,
              cursor: sanitizedCursor,
              documentId
            }
          });
        } catch (error) {
          log('WARN', 'Cursor broadcast failed', { sessionId: item.sessionId });
        }
      });

    await Promise.allSettled(broadcastPromises);
    
    return { statusCode: 200, body: 'Cursor updated' };
  } catch (error) {
    log('ERROR', 'Cursor error', { error: error.message });
    return { statusCode: 500, body: 'Cursor update failed' };
  }
}

async function getDocument(documentId) {
  try {
    if (!validator.isUUID(documentId)) {
      return null;
    }
    
    const result = await dynamodb.get({
      TableName: 'kriya-documents',
      Key: { documentId }
    }).promise();
    
    return result.Item;
  } catch (error) {
    log('ERROR', 'Get document error', { error: error.message });
    return null;
  }
}

async function sendToConnection(connectionId, message) {
  try {
    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(message)
    }).promise();
  } catch (error) {
    if (error.statusCode === 410) {
      await dynamodb.delete({
        TableName: 'kriya-sessions',
        Key: { sessionId: connectionId }
      }).promise();
    }
    throw error;
  }
}