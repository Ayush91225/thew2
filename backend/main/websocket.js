const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const apiGateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT || 'https://xtc3torv9c.execute-api.ap-south-1.amazonaws.com/prod'
});

// Enhanced logging
const log = (level, message, data = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    requestId: process.env.AWS_REQUEST_ID
  }));
};

// Connection management
exports.handler = async (event) => {
  const { requestContext, body } = event;
  const { connectionId, routeKey } = requestContext;

  log('INFO', 'WebSocket event received', { connectionId, routeKey, body });

  try {
    switch (routeKey) {
      case '$connect':
        return await handleConnect(connectionId, event);
      case '$disconnect':
        return await handleDisconnect(connectionId);
      case 'join-document':
        return await handleJoinDocument(connectionId, JSON.parse(body || '{}'));
      case 'operation':
        return await handleOperation(connectionId, JSON.parse(body || '{}'));
      case 'cursor-update':
        return await handleCursorUpdate(connectionId, JSON.parse(body || '{}'));
      default:
        log('WARN', 'Unknown route', { routeKey });
        return { statusCode: 400, body: 'Unknown route' };
    }
  } catch (error) {
    log('ERROR', 'WebSocket handler error', { error: error.message, stack: error.stack });
    return { statusCode: 500, body: 'Internal server error' };
  }
};

async function handleConnect(connectionId, event) {
  const token = event.queryStringParameters?.token;
  
  log('INFO', 'Connection attempt', { connectionId, hasToken: !!token });
  
  if (!token) {
    log('WARN', 'Connection rejected - no token', { connectionId });
    return { statusCode: 401, body: 'Unauthorized' };
  }

  try {
    // For demo, accept base64 encoded JSON tokens
    let decoded;
    try {
      // Try base64 first for demo tokens
      decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      log('INFO', 'Using demo base64 token', { decoded });
    } catch (base64Error) {
      try {
        // Fallback to JWT
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'kriya-secret-key');
        log('INFO', 'Using JWT token', { decoded });
      } catch (jwtError) {
        throw new Error('Invalid token format');
      }
    }
    
    await dynamodb.put({
      TableName: 'kriya-sessions',
      Item: {
        sessionId: connectionId,
        userId: decoded.userId || 'demo-user',
        userInfo: decoded,
        connectedAt: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      }
    }).promise();

    log('INFO', 'Connection established', { connectionId, userId: decoded.userId });
    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    log('ERROR', 'Authentication failed', { connectionId, error: error.message });
    return { statusCode: 401, body: 'Invalid token' };
  }
}

async function handleDisconnect(connectionId) {
  log('INFO', 'Disconnection', { connectionId });
  
  try {
    await dynamodb.delete({
      TableName: 'kriya-sessions',
      Key: { sessionId: connectionId }
    }).promise();
    
    log('INFO', 'Session cleaned up', { connectionId });
  } catch (error) {
    log('ERROR', 'Cleanup error', { connectionId, error: error.message });
  }

  return { statusCode: 200, body: 'Disconnected' };
}

async function handleJoinDocument(connectionId, data) {
  const { documentId, mode } = data;
  
  log('INFO', 'Join document request', { connectionId, documentId, mode });
  
  try {
    // Get user info
    const session = await dynamodb.get({
      TableName: 'kriya-sessions',
      Key: { sessionId: connectionId }
    }).promise();

    if (!session.Item) {
      log('WARN', 'Session not found', { connectionId });
      return { statusCode: 401, body: 'Session not found' };
    }

    if (mode === 'solo') {
      const document = await getDocument(documentId);
      await sendToConnection(connectionId, {
        type: 'document-joined',
        data: { documentId, mode: 'solo', content: document?.content || '' }
      });
      log('INFO', 'Joined solo mode', { connectionId, documentId });
      return { statusCode: 200, body: 'Joined solo mode' };
    }

    // Live collaboration mode
    await sendToConnection(connectionId, {
      type: 'document-joined',
      data: {
        documentId,
        mode: 'live',
        users: [{ 
          id: session.Item.userId, 
          name: session.Item.userId, // Use IP as name
          avatar: `https://api.dicebear.com/9.x/glass/svg?seed=${session.Item.userId}`
        }]
      }
    });
    
    log('INFO', 'Joined live mode', { connectionId, documentId });
    return { statusCode: 200, body: 'Joined live mode' };
  } catch (error) {
    log('ERROR', 'Join document error', { connectionId, error: error.message });
    return { statusCode: 500, body: 'Join failed' };
  }
}

async function handleOperation(connectionId, data) {
  const { documentId, operation } = data;
  
  log('INFO', 'Operation received', { connectionId, documentId, operation });
  
  try {
    const session = await dynamodb.get({
      TableName: 'kriya-sessions',
      Key: { sessionId: connectionId }
    }).promise();

    if (!session.Item) {
      return { statusCode: 401, body: 'Session not found' };
    }

    // Echo operation back to sender for confirmation
    await sendToConnection(connectionId, {
      type: 'operation-confirmed',
      data: { operation }
    });
    
    log('INFO', 'Operation processed', { connectionId, documentId });
    return { statusCode: 200, body: 'Operation processed' };
  } catch (error) {
    log('ERROR', 'Operation error', { connectionId, error: error.message });
    return { statusCode: 500, body: 'Operation failed' };
  }
}

async function handleCursorUpdate(connectionId, data) {
  const { documentId, cursor } = data;
  
  log('INFO', 'Cursor update', { connectionId, documentId, cursor });
  
  return { statusCode: 200, body: 'Cursor updated' };
}

// Helper functions
async function getDocument(documentId) {
  try {
    const result = await dynamodb.get({
      TableName: 'kriya-documents',
      Key: { documentId }
    }).promise();
    
    return result.Item;
  } catch (error) {
    log('ERROR', 'Get document error', { documentId, error: error.message });
    return null;
  }
}

async function sendToConnection(connectionId, message) {
  try {
    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(message)
    }).promise();
    
    log('INFO', 'Message sent', { connectionId, messageType: message.type });
  } catch (error) {
    log('ERROR', 'Send message error', { connectionId, error: error.message });
    
    if (error.statusCode === 410) {
      // Connection is stale, remove it
      await dynamodb.delete({
        TableName: 'kriya-sessions',
        Key: { sessionId: connectionId }
      }).promise();
      
      log('INFO', 'Stale connection cleaned up', { connectionId });
    }
    throw error;
  }
}