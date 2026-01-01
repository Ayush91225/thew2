const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

const app = express();
const server = http.createServer(app);

// Configure AWS
AWS.config.update({ region: 'ap-south-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://kriya.navchetna.tech",
  credentials: true
}));
app.use(express.json());

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://kriya.navchetna.tech",
    methods: ["GET", "POST"]
  }
});

// In-memory storage for active sessions (use Redis in production)
const activeSessions = new Map();
const userSessions = new Map();

// Document collaboration state
class DocumentSession {
  constructor(documentId) {
    this.documentId = documentId;
    this.content = '';
    this.users = new Map();
    this.operations = [];
    this.version = 0;
    this.cursors = new Map();
  }

  addUser(userId, socketId, userInfo) {
    this.users.set(userId, { socketId, ...userInfo, joinedAt: Date.now() });
  }

  removeUser(userId) {
    this.users.delete(userId);
    this.cursors.delete(userId);
  }

  applyOperation(operation) {
    this.operations.push({
      ...operation,
      version: ++this.version,
      timestamp: Date.now()
    });
    return this.version;
  }

  updateCursor(userId, cursor) {
    this.cursors.set(userId, cursor);
  }
}

// Authentication middleware for socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kriya-secret');
    socket.userId = decoded.userId;
    socket.userInfo = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);

  // Join document session
  socket.on('join-document', async (data) => {
    const { documentId, mode } = data;
    
    if (mode === 'solo') {
      socket.emit('document-joined', { 
        documentId, 
        mode: 'solo',
        content: await getDocumentContent(documentId)
      });
      return;
    }

    // Live collaboration mode
    socket.join(documentId);
    
    if (!activeSessions.has(documentId)) {
      activeSessions.set(documentId, new DocumentSession(documentId));
    }

    const session = activeSessions.get(documentId);
    session.addUser(socket.userId, socket.id, socket.userInfo);

    // Send current document state
    socket.emit('document-joined', {
      documentId,
      mode: 'live',
      content: session.content,
      version: session.version,
      users: Array.from(session.users.entries()).map(([id, user]) => ({
        id,
        name: user.name,
        avatar: user.avatar,
        cursor: session.cursors.get(id)
      }))
    });

    // Notify other users
    socket.to(documentId).emit('user-joined', {
      userId: socket.userId,
      userInfo: socket.userInfo
    });
  });

  // Handle text operations
  socket.on('operation', (data) => {
    const { documentId, operation } = data;
    const session = activeSessions.get(documentId);
    
    if (!session) return;

    const version = session.applyOperation({
      ...operation,
      userId: socket.userId
    });

    // Broadcast to other users
    socket.to(documentId).emit('operation', {
      operation: {
        ...operation,
        userId: socket.userId,
        version
      }
    });

    // Save to database periodically
    saveDocumentState(documentId, session);
  });

  // Handle cursor updates
  socket.on('cursor-update', (data) => {
    const { documentId, cursor } = data;
    const session = activeSessions.get(documentId);
    
    if (!session) return;

    session.updateCursor(socket.userId, cursor);
    
    socket.to(documentId).emit('cursor-update', {
      userId: socket.userId,
      cursor
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
    
    // Remove from all sessions
    for (const [documentId, session] of activeSessions) {
      if (session.users.has(socket.userId)) {
        session.removeUser(socket.userId);
        
        socket.to(documentId).emit('user-left', {
          userId: socket.userId
        });

        // Clean up empty sessions
        if (session.users.size === 0) {
          activeSessions.delete(documentId);
        }
      }
    }
  });
});

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/documents', async (req, res) => {
  try {
    const documentId = uuidv4();
    const { name, content = '', language = 'javascript' } = req.body;
    
    await dynamodb.put({
      TableName: 'kriya-documents',
      Item: {
        documentId,
        name,
        content,
        language,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 0
      }
    }).promise();

    res.json({ documentId, name, content, language });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

app.get('/api/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await dynamodb.get({
      TableName: 'kriya-documents',
      Key: { documentId }
    }).promise();

    if (!result.Item) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(result.Item);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Helper functions
async function getDocumentContent(documentId) {
  try {
    const result = await dynamodb.get({
      TableName: 'kriya-documents',
      Key: { documentId }
    }).promise();
    
    return result.Item?.content || '';
  } catch (error) {
    console.error('Error getting document content:', error);
    return '';
  }
}

async function saveDocumentState(documentId, session) {
  try {
    await dynamodb.update({
      TableName: 'kriya-documents',
      Key: { documentId },
      UpdateExpression: 'SET content = :content, version = :version, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':content': session.content,
        ':version': session.version,
        ':updatedAt': Date.now()
      }
    }).promise();
  } catch (error) {
    console.error('Error saving document state:', error);
  }
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`KRIYA Collaboration Server running on port ${PORT}`);
});

module.exports = { app, server };