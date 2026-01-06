const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const validator = require('validator');

const app = express();
const server = http.createServer(app);

// Configure AWS
AWS.config.update({ region: 'ap-south-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://kriya.navchetna.tech",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: true });

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
    if (!decoded.userId || !validator.isUUID(decoded.userId)) {
      return next(new Error('Invalid user ID'));
    }
    socket.userId = decoded.userId;
    socket.userInfo = {
      name: validator.escape(decoded.name || 'Anonymous'),
      avatar: validator.isURL(decoded.avatar || '') ? decoded.avatar : ''
    };
    next();
  } catch (err) {
    console.error('Socket authentication error:', err);
    next(new Error('Authentication error'));
  }
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);

  // Join document session
  socket.on('join-document', async (data) => {
    try {
      const { documentId, mode } = data;
      
      if (!documentId || !validator.isUUID(documentId)) {
        socket.emit('error', { message: 'Invalid document ID' });
        return;
      }
      
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
    } catch (error) {
      console.error('Error joining document:', error);
      socket.emit('error', { message: 'Failed to join document' });
    }
  });

  // Handle text operations
  socket.on('operation', (data) => {
    try {
      const { documentId, operation } = data;
      
      if (!documentId || !validator.isUUID(documentId)) {
        return;
      }
      
      const session = activeSessions.get(documentId);
      if (!session) return;

      // Validate operation
      if (!operation || !['insert', 'delete'].includes(operation.type)) {
        return;
      }

      const version = session.applyOperation({
        ...operation,
        userId: socket.userId
      });

      // Apply operation to document content with bounds checking
      if (operation.type === 'insert' && operation.content) {
        const pos = Math.max(0, Math.min(operation.position, session.content.length));
        const sanitizedContent = validator.escape(operation.content.substring(0, 10000));
        session.content = session.content.slice(0, pos) + sanitizedContent + session.content.slice(pos);
      } else if (operation.type === 'delete' && operation.length) {
        const pos = Math.max(0, Math.min(operation.position, session.content.length));
        const length = Math.max(0, Math.min(operation.length, session.content.length - pos));
        session.content = session.content.slice(0, pos) + session.content.slice(pos + length);
      }

      // Broadcast to other users in real-time
      socket.to(documentId).emit('operation', {
        operation: {
          ...operation,
          userId: socket.userId,
          version
        }
      });

      // Save to database periodically
      saveDocumentState(documentId, session);
    } catch (error) {
      console.error('Error handling operation:', error);
    }
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

app.post('/api/documents', csrfProtection, async (req, res) => {
  try {
    const documentId = uuidv4();
    const { name, content = '', language = 'javascript' } = req.body;
    
    // Validate inputs
    if (!name || name.length > 100) {
      return res.status(400).json({ error: 'Invalid document name' });
    }
    
    if (content.length > 1000000) { // 1MB limit
      return res.status(400).json({ error: 'Content too large' });
    }
    
    const allowedLanguages = ['javascript', 'python', 'java', 'cpp', 'html', 'css'];
    if (!allowedLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }
    
    const sanitizedName = validator.escape(name);
    const sanitizedContent = validator.escape(content);
    
    const params = {
      TableName: 'kriya-documents',
      Item: {
        documentId,
        name: sanitizedName,
        content: sanitizedContent,
        language,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 0
      }
    };

    await dynamodb.put(params).promise();

    res.json({ documentId, name: sanitizedName, content: sanitizedContent, language });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

app.get('/api/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    if (!validator.isUUID(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }
    
    const params = {
      TableName: 'kriya-documents',
      Key: { documentId }
    };
    
    const result = await dynamodb.get(params).promise();

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
    if (!validator.isUUID(documentId)) {
      return '';
    }
    
    const params = {
      TableName: 'kriya-documents',
      Key: { documentId }
    };
    
    const result = await dynamodb.get(params).promise();
    
    return result.Item?.content || '';
  } catch (error) {
    console.error('Error getting document content:', error);
    return '';
  }
}

async function saveDocumentState(documentId, session) {
  try {
    if (!validator.isUUID(documentId)) {
      return;
    }
    
    const params = {
      TableName: 'kriya-documents',
      Key: { documentId },
      UpdateExpression: 'SET content = :content, version = :version, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':content': session.content,
        ':version': session.version,
        ':updatedAt': Date.now()
      }
    };
    
    await dynamodb.update(params).promise();
  } catch (error) {
    console.error('Error saving document state:', error);
  }
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`KRIYA Collaboration Server running on port ${PORT}`);
});

module.exports = { app, server };