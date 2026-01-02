const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body);
  
  console.log('Message:', { connectionId, action: body.action });
  
  // Set up API Gateway Management API with the correct endpoint
  const apigateway = new AWS.ApiGatewayManagementApi({
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`
  });
  
  try {
    switch (body.action) {
      case 'join-document':
        return await handleJoinDocument(connectionId, body, apigateway);
      case 'operation':
        return await handleOperation(connectionId, body, apigateway);
      case 'cursor-update':
        return await handleCursorUpdate(connectionId, body, apigateway);
      default:
        return { statusCode: 400 };
    }
  } catch (error) {
    console.error('Message error:', error);
    return { statusCode: 500 };
  }
};

async function handleJoinDocument(connectionId, { documentId, mode }, apigateway) {
  console.log('Join document request:', { connectionId, documentId, mode });
  
  // Update connection with document info
  await dynamodb.update({
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId },
    UpdateExpression: 'SET documentId = :docId, mode = :mode, joinedAt = :joinedAt',
    ExpressionAttributeValues: {
      ':docId': documentId,
      ':mode': mode,
      ':joinedAt': Date.now()
    },
  }).promise();
  
  // Get document content
  const doc = await dynamodb.get({
    TableName: process.env.DOCUMENTS_TABLE,
    Key: { id: documentId },
  }).promise();
  
  if (doc.Item) {
    await sendToConnection(connectionId, {
      type: 'document-content',
      data: {
        content: doc.Item.content,
        version: doc.Item.version,
        language: doc.Item.language,
      },
    }, apigateway);
  }
  
  // Notify other users in the document
  if (mode === 'live') {
    const connections = await getDocumentConnections(documentId);
    console.log('Notifying other users, found connections:', connections.length);
    
    const otherConnections = connections.filter(c => c.connectionId !== connectionId);
    if (otherConnections.length > 0) {
      await broadcastToConnections(otherConnections, {
        type: 'user-joined',
        data: { connectionId },
      }, apigateway);
    }
  }
  
  return { statusCode: 200 };
}

async function handleOperation(connectionId, { documentId, operation }, apigateway) {
  console.log('Processing operation:', { connectionId, documentId, operation });
  
  // Get all connections for this document
  const connections = await getDocumentConnections(documentId);
  console.log('Found connections for document:', connections.length);
  
  // Broadcast to other connections (exclude sender)
  const otherConnections = connections.filter(c => c.connectionId !== connectionId);
  console.log('Broadcasting to connections:', otherConnections.length);
  
  if (otherConnections.length > 0) {
    await broadcastToConnections(
      otherConnections,
      {
        type: 'operation',
        operation: operation // Direct operation format for frontend
      },
      apigateway
    );
  }
  
  // Send confirmation back to sender
  await sendToConnection(connectionId, {
    type: 'operation-confirmed',
    data: { operation }
  }, apigateway);
  
  return { statusCode: 200 };
}

async function handleCursorUpdate(connectionId, { documentId, cursor }, apigateway) {
  console.log('Processing cursor update:', { connectionId, documentId, cursor });
  
  const connections = await getDocumentConnections(documentId);
  const otherConnections = connections.filter(c => c.connectionId !== connectionId);
  
  if (otherConnections.length > 0) {
    await broadcastToConnections(
      otherConnections,
      {
        type: 'cursor-update',
        userId: connectionId,
        cursor: cursor
      },
      apigateway
    );
  }
  
  return { statusCode: 200 };
}

async function getDocumentConnections(documentId) {
  const result = await dynamodb.scan({
    TableName: process.env.CONNECTIONS_TABLE,
    FilterExpression: 'documentId = :docId AND mode = :mode',
    ExpressionAttributeValues: {
      ':docId': documentId,
      ':mode': 'live',
    },
  }).promise();
  
  return result.Items;
}

async function broadcastToConnections(connections, message, apigateway) {
  console.log(`📡 Broadcasting message to ${connections.length} connections:`, message);
  
  const promises = connections.map(async (connection) => {
    try {
      await sendToConnection(connection.connectionId, message, apigateway);
      console.log(`✅ Message sent to connection: ${connection.connectionId}`);
      return { success: true, connectionId: connection.connectionId };
    } catch (error) {
      console.error(`❌ Failed to send to connection ${connection.connectionId}:`, error.message);
      return { success: false, connectionId: connection.connectionId, error: error.message };
    }
  });
  
  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;
  
  console.log(`📊 Broadcast results: ${successful} successful, ${failed} failed`);
  return results;
}

async function sendToConnection(connectionId, message, apigateway) {
  try {
    console.log(`📤 Sending message to ${connectionId}:`, JSON.stringify(message));
    
    await apigateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(message),
    }).promise();
    
    console.log(`✅ Message delivered to ${connectionId}`);
  } catch (error) {
    console.error(`❌ Error sending to ${connectionId}:`, error.message);
    
    if (error.statusCode === 410) {
      console.log(`🧹 Cleaning up stale connection: ${connectionId}`);
      // Connection is stale, remove it
      await dynamodb.delete({
        TableName: process.env.CONNECTIONS_TABLE,
        Key: { connectionId },
      }).promise();
    }
    throw error;
  }
}