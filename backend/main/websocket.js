const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const apiGateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

// Connection management
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
        return await handleJoinDocument(connectionId, JSON.parse(body));
      case 'operation':
        return await handleOperation(connectionId, JSON.parse(body));
      case 'cursor-update':
        return await handleCursorUpdate(connectionId, JSON.parse(body));
      default:
        return { statusCode: 400, body: 'Unknown route' };
    }
  } catch (error) {
    console.error('WebSocket error:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};

async function handleConnect(connectionId, event) {
  const token = event.queryStringParameters?.token;
  
  if (!token) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await dynamodb.put({
      TableName: 'kriya-sessions',
      Item: {
        sessionId: connectionId,
        userId: decoded.userId,
        userInfo: decoded,
        connectedAt: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      }
    }).promise();

    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    return { statusCode: 401, body: 'Invalid token' };
  }
}

async function handleDisconnect(connectionId) {
  await dynamodb.delete({
    TableName: 'kriya-sessions',
    Key: { sessionId: connectionId }
  }).promise();

  return { statusCode: 200, body: 'Disconnected' };
}

async function handleJoinDocument(connectionId, data) {
  const { documentId, mode } = data;
  
  // Get user info
  const session = await dynamodb.get({
    TableName: 'kriya-sessions',
    Key: { sessionId: connectionId }
  }).promise();

  if (!session.Item) {
    return { statusCode: 401, body: 'Session not found' };
  }

  if (mode === 'solo') {
    const document = await getDocument(documentId);
    await sendToConnection(connectionId, {
      type: 'document-joined',
      data: { documentId, mode: 'solo', content: document?.content || '' }
    });
    return { statusCode: 200, body: 'Joined solo mode' };
  }

  // Live collaboration mode - notify other users
  const activeUsers = await getActiveUsers(documentId);
  
  // Broadcast user joined
  await broadcastToDocument(documentId, {
    type: 'user-joined',
    data: {
      userId: session.Item.userId,
      userInfo: session.Item.userInfo
    }
  }, connectionId);

  await sendToConnection(connectionId, {
    type: 'document-joined',
    data: {
      documentId,
      mode: 'live',
      users: activeUsers
    }
  });

  return { statusCode: 200, body: 'Joined live mode' };
}

async function handleOperation(connectionId, data) {
  const { documentId, operation } = data;
  
  // Get user info
  const session = await dynamodb.get({
    TableName: 'kriya-sessions',
    Key: { sessionId: connectionId }
  }).promise();

  if (!session.Item) {
    return { statusCode: 401, body: 'Session not found' };
  }

  // Broadcast operation to other users
  await broadcastToDocument(documentId, {
    type: 'operation',
    data: {
      operation: {
        ...operation,
        userId: session.Item.userId,
        timestamp: Date.now()
      }
    }
  }, connectionId);

  return { statusCode: 200, body: 'Operation broadcasted' };
}

async function handleCursorUpdate(connectionId, data) {
  const { documentId, cursor } = data;
  
  const session = await dynamodb.get({
    TableName: 'kriya-sessions',
    Key: { sessionId: connectionId }
  }).promise();

  if (!session.Item) {
    return { statusCode: 401, body: 'Session not found' };
  }

  await broadcastToDocument(documentId, {
    type: 'cursor-update',
    data: {
      userId: session.Item.userId,
      cursor
    }
  }, connectionId);

  return { statusCode: 200, body: 'Cursor updated' };
}

// Helper functions
async function getDocument(documentId) {
  const result = await dynamodb.get({
    TableName: 'kriya-documents',
    Key: { documentId }
  }).promise();
  
  return result.Item;
}

async function getActiveUsers(documentId) {
  // In a real implementation, you'd track active users per document
  return [];
}

async function broadcastToDocument(documentId, message, excludeConnectionId) {
  // In a real implementation, you'd maintain a mapping of documentId to connectionIds
  // For now, this is a simplified version
}

async function sendToConnection(connectionId, message) {
  try {
    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(message)
    }).promise();
  } catch (error) {
    if (error.statusCode === 410) {
      // Connection is stale, remove it
      await dynamodb.delete({
        TableName: 'kriya-sessions',
        Key: { sessionId: connectionId }
      }).promise();
    }
    throw error;
  }
}