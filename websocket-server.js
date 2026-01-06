const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const sessions = new Map();
const documents = new Map();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  let userId = 'anonymous';
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    userId = decoded.userId || 'anonymous';
  } catch (e) {
    console.log('Invalid token, using anonymous user');
  }

  console.log(`User ${userId} connected`);
  
  sessions.set(ws, { userId, documentId: null });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received:', message);

      switch (message.action) {
        case 'join-document':
          handleJoinDocument(ws, message);
          break;
        case 'operation':
          handleOperation(ws, message);
          break;
        case 'cursor-update':
          handleCursorUpdate(ws, message);
          break;
      }
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  ws.on('close', () => {
    console.log(`User ${userId} disconnected`);
    const session = sessions.get(ws);
    if (session && session.documentId && documents.has(session.documentId)) {
      const doc = documents.get(session.documentId);
      doc.users.delete(ws);
    }
    sessions.delete(ws);
  });
});

function handleJoinDocument(ws, message) {
  const session = sessions.get(ws);
  const oldDocumentId = session.documentId;
  
  // Leave old document if exists
  if (oldDocumentId && documents.has(oldDocumentId)) {
    const oldDoc = documents.get(oldDocumentId);
    oldDoc.users.delete(ws);
  }
  
  session.documentId = message.documentId;
  
  if (!documents.has(message.documentId)) {
    documents.set(message.documentId, { content: '', users: new Set() });
  }
  
  const doc = documents.get(message.documentId);
  doc.users.add(ws);
  
  ws.send(JSON.stringify({
    type: 'document-joined',
    data: {
      documentId: message.documentId,
      mode: message.mode,
      content: doc.content,
      users: Array.from(doc.users).map(userWs => {
        const userSession = sessions.get(userWs);
        return userSession ? {
          id: userSession.userId,
          name: userSession.userId
        } : null;
      }).filter(user => user !== null)
    }
  }));
  
  // If document has content, send it as a replace operation to sync the new user
  if (doc.content && doc.content.length > 0) {
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'operation',
        data: {
          operation: {
            type: 'replace',
            position: 0,
            content: doc.content,
            userId: 'server'
          }
        }
      }));
    }, 100);
  }
  
  console.log(`User ${session.userId} joined document ${message.documentId}. Total users: ${doc.users.size}`);
  
  // Notify other users about new user joining
  doc.users.forEach(userWs => {
    if (userWs !== ws && userWs.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify({
        type: 'user-joined',
        data: {
          userId: session.userId,
          userInfo: {
            name: session.userId,
            avatar: `https://api.dicebear.com/9.x/glass/svg?seed=${session.userId}`
          }
        }
      }));
    }
  });
}

function handleOperation(ws, message) {
  const session = sessions.get(ws);
  const doc = documents.get(session.documentId);
  
  if (!doc) return;
  
  // Apply operation to document
  const op = message.operation;
  if (op.type === 'replace') {
    doc.content = op.content;
  } else if (op.type === 'insert') {
    const pos = op.position || 0;
    doc.content = doc.content.slice(0, pos) + op.content + doc.content.slice(pos);
  } else if (op.type === 'delete') {
    const pos = op.position || 0;
    doc.content = doc.content.slice(0, pos) + doc.content.slice(pos + op.length);
  }
  
  // Broadcast to other users
  console.log(`Broadcasting to ${doc.users.size - 1} other users`);
  doc.users.forEach(userWs => {
    if (userWs !== ws && userWs.readyState === WebSocket.OPEN) {
      console.log(`Sending operation to user ${sessions.get(userWs).userId}`);
      userWs.send(JSON.stringify({
        type: 'operation',
        data: {
          operation: {
            ...op,
            userId: session.userId
          }
        }
      }));
    }
  });
  
  // Confirm to sender
  ws.send(JSON.stringify({
    type: 'operation-confirmed',
    data: { operation: op }
  }));
  
  console.log(`Operation from ${session.userId}:`, op.type);
}

function handleCursorUpdate(ws, message) {
  const session = sessions.get(ws);
  const doc = documents.get(session.documentId);
  
  if (!doc) return;
  
  // Broadcast cursor to other users
  doc.users.forEach(userWs => {
    if (userWs !== ws && userWs.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify({
        type: 'cursor-update',
        data: {
          userId: session.userId,
          cursor: message.cursor
        }
      }));
    }
  });
}

const PORT = 8081;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);
});