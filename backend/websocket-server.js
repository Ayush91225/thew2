const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8082 });

const documents = new Map();
const sessions = new Map();

wss.on('connection', (ws, req) => {
  const sessionId = Math.random().toString(36).substring(7);
  console.log(`Client connected: ${sessionId}`);
  
  sessions.set(sessionId, {
    ws,
    userId: 'demo-user',
    documentId: null
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);
      
      switch (message.action) {
        case 'join-document':
          handleJoinDocument(sessionId, message);
          break;
        case 'operation':
          handleOperation(sessionId, message);
          break;
        case 'cursor-update':
          handleCursorUpdate(sessionId, message);
          break;
      }
    } catch (error) {
      console.error('Message parsing error:', error);
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${sessionId}`);
    sessions.delete(sessionId);
  });
});

function handleJoinDocument(sessionId, message) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  const { documentId, mode } = message;
  session.documentId = documentId;
  
  if (!documents.has(documentId)) {
    documents.set(documentId, {
      content: '',
      users: new Set()
    });
  }
  
  const doc = documents.get(documentId);
  doc.users.add(sessionId);
  
  const users = Array.from(doc.users).map(id => ({
    id: sessions.get(id)?.userId || 'unknown',
    name: sessions.get(id)?.userId || 'unknown'
  }));
  
  session.ws.send(JSON.stringify({
    type: 'document-joined',
    data: {
      documentId,
      mode,
      users,
      content: doc.content
    }
  }));
  
  console.log(`User ${session.userId} joined document ${documentId}`);
}

function handleOperation(sessionId, message) {
  const session = sessions.get(sessionId);
  if (!session || !session.documentId) return;
  
  const { documentId, operation } = message;
  
  // Broadcast to all other users in the same document
  sessions.forEach((otherSession, otherSessionId) => {
    if (otherSessionId !== sessionId && 
        otherSession.documentId === documentId && 
        otherSession.ws.readyState === WebSocket.OPEN) {
      
      otherSession.ws.send(JSON.stringify({
        type: 'operation',
        data: {
          operation: {
            ...operation,
            userId: session.userId
          },
          documentId
        }
      }));
    }
  });
  
  // Send confirmation back to sender
  session.ws.send(JSON.stringify({
    type: 'operation-confirmed',
    data: { operation }
  }));
  
  console.log(`Operation broadcasted for document ${documentId}`);
}

function handleCursorUpdate(sessionId, message) {
  const session = sessions.get(sessionId);
  if (!session || !session.documentId) return;
  
  const { documentId, cursor } = message;
  
  // Broadcast cursor update to all other users in the same document
  sessions.forEach((otherSession, otherSessionId) => {
    if (otherSessionId !== sessionId && 
        otherSession.documentId === documentId && 
        otherSession.ws.readyState === WebSocket.OPEN) {
      
      otherSession.ws.send(JSON.stringify({
        type: 'cursor-update',
        data: {
          userId: session.userId,
          cursor,
          documentId
        }
      }));
    }
  });
}

console.log('WebSocket server running on ws://localhost:8082');