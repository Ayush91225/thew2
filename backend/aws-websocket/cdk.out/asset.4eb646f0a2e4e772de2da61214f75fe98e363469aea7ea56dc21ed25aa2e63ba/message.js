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
    }, apigateway);
  }
  
  // Notify other users in the document
  if (mode === 'live') {
    const connections = await getDocumentConnections(documentId);
    await broadcastToConnections(connections.filter(c => c.connectionId !== connectionId), {
      type: 'user-joined',
      data: { connectionId },
    }, apigateway);
  }
  
  return { statusCode: 200 };
}

async function handleOperation(connectionId, { documentId, operation }, apigateway) {
  // Get all connections for this document
  const connections = await getDocumentConnections(documentId);
  
  // Broadcast to other connections (exclude sender)
  const otherConnections = connections.filter(c => c.connectionId !== connectionId);
  
  await broadcastToConnections(
    otherConnections,
    {
      type: 'operation',
      data: { operation },
    },
    apigateway
  );
  
  // Send confirmation back to sender
  await sendToConnection(connectionId, {
    type: 'operation-confirmed',
    data: { operation }
  }, apigateway);
  
  return { statusCode: 200 };
}

async function handleCursorUpdate(connectionId, { documentId, cursor }, apigateway) {
  const connections = await getDocumentConnections(documentId);
  
  await broadcastToConnections(
    connections.filter(c => c.connectionId !== connectionId),
    {
      type: 'cursor-update',
      data: { userId: connectionId, cursor },
    },
    apigateway
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

async function broadcastToConnections(connections, message, apigateway) {
  const promises = connections.map(connection =>
    sendToConnection(connection.connectionId, message, apigateway)
  );
  
  await Promise.allSettled(promises);
}

async function sendToConnection(connectionId, message, apigateway) {
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