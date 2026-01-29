const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const apigateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body);
  
  console.log('Message:', { connectionId, action: body.action });
  
  try {
    switch (body.action) {
      case 'join-document':
        return await handleJoinDocument(connectionId, body);
      case 'operation':
        return await handleOperation(connectionId, body);
      case 'cursor-update':
        return await handleCursorUpdate(connectionId, body);
      default:
        return { statusCode: 400 };
    }
  } catch (error) {
    console.error('Message error:', error);
    return { statusCode: 500 };
  }
};

async function handleJoinDocument(connectionId, { documentId, mode }) {
  // Update connection with document info
  await dynamodb.update({
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId },
    UpdateExpression: 'SET documentId = :docId, mode = :mode',
    ExpressionAttributeValues: {
      ':docId': documentId,
      ':mode': mode,
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
    });
  }
  
  // Notify other users in the document
  if (mode === 'live') {
    const connections = await getDocumentConnections(documentId);
    await broadcastToConnections(connections.filter(c => c.connectionId !== connectionId), {
      type: 'user-joined',
      data: { connectionId },
    });
  }
  
  return { statusCode: 200 };
}

async function handleOperation(connectionId, { documentId, operation }) {
  // Get all connections for this document
  const connections = await getDocumentConnections(documentId);
  
  // Broadcast to other connections
  await broadcastToConnections(
    connections.filter(c => c.connectionId !== connectionId),
    {
      type: 'operation',
      data: operation,
    }
  );
  
  return { statusCode: 200 };
}

async function handleCursorUpdate(connectionId, { documentId, cursor }) {
  const connections = await getDocumentConnections(documentId);
  
  await broadcastToConnections(
    connections.filter(c => c.connectionId !== connectionId),
    {
      type: 'cursor-update',
      data: { connectionId, cursor },
    }
  );
  
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

async function broadcastToConnections(connections, message) {
  const promises = connections.map(connection =>
    sendToConnection(connection.connectionId, message)
  );
  
  await Promise.allSettled(promises);
}

async function sendToConnection(connectionId, message) {
  try {
    await apigateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(message),
    }).promise();
  } catch (error) {
    if (error.statusCode === 410) {
      // Connection is stale, remove it
      await dynamodb.delete({
        TableName: process.env.CONNECTIONS_TABLE,
        Key: { connectionId },
      }).promise();
    }
    throw error;
  }
}