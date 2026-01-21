const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const server = http.createServer(app);

// In-memory storage (replace with local database if needed)
const documents = new Map();
const activeSessions = new Map();
const userSessions = new Map();

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://kriya.navchetna.tech"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://kriya.navchetna.tech"],
    methods: ["GET", "POST"]
  }
});

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

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Set default user info
  socket.userId = socket.id;
  socket.userInfo = {
    name: `User-${socket.id.slice(0, 6)}`,
    avatar: ''
  };

  // Join document session
  socket.on('join-document', async (data) => {
    try {
      const { documentId, mode } = data;
      
      if (!documentId) {
        socket.emit('error', { message: 'Invalid document ID' });
        return;
      }
      
      if (mode === 'solo') {
        const content = await getDocumentContent(documentId);
        socket.emit('document-joined', { 
          documentId, 
          mode: 'solo',
          content
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
      
      console.log(`User ${socket.userId} joined document ${documentId}`);
    } catch (error) {
      console.error('Error joining document:', error);
      socket.emit('error', { message: 'Failed to join document' });
    }
  });

  // Handle text operations
  socket.on('operation', (data) => {
    try {
      const { documentId, operation } = data;
      
      if (!documentId || !operation) {
        return;
      }
      
      const session = activeSessions.get(documentId);
      if (!session) return;

      // Validate operation
      if (!['insert', 'delete', 'replace'].includes(operation.type)) {
        return;
      }

      const version = session.applyOperation({
        ...operation,
        userId: socket.userId
      });

      // Apply operation to document content
      if (operation.type === 'insert' && operation.content) {
        const pos = Math.max(0, Math.min(operation.position || 0, session.content.length));
        session.content = session.content.slice(0, pos) + operation.content + session.content.slice(pos);
      } else if (operation.type === 'delete' && operation.length) {
        const pos = Math.max(0, Math.min(operation.position || 0, session.content.length));
        const length = Math.max(0, Math.min(operation.length, session.content.length - pos));
        session.content = session.content.slice(0, pos) + session.content.slice(pos + length);
      } else if (operation.type === 'replace' && operation.content !== undefined) {
        session.content = operation.content;
      }

      // Broadcast to other users
      socket.to(documentId).emit('operation', {
        operation: {
          ...operation,
          userId: socket.userId,
          version
        }
      });

      // Save document periodically
      saveDocumentState(documentId, session);
    } catch (error) {
      console.error('Error handling operation:', error);
    }
  });

  // Handle cursor updates
  socket.on('cursor-update', (data) => {
    try {
      const { documentId, cursor } = data;
      const session = activeSessions.get(documentId);
      
      if (!session) return;

      session.updateCursor(socket.userId, cursor);
      
      socket.to(documentId).emit('cursor-update', {
        userId: socket.userId,
        cursor
      });
    } catch (error) {
      console.error('Error handling cursor update:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
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
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activeSessions: activeSessions.size,
    totalUsers: Array.from(activeSessions.values()).reduce((sum, session) => sum + session.users.size, 0)
  });
});

app.post('/api/documents', async (req, res) => {
  try {
    const documentId = uuidv4();
    const { name, content = '', language = 'javascript' } = req.body;
    
    if (!name || name.length > 100) {
      return res.status(400).json({ error: 'Invalid document name' });
    }
    
    if (content.length > 1000000) {
      return res.status(400).json({ error: 'Content too large' });
    }
    
    const document = {
      documentId,
      name: name.replace(/[<>\"'&]/g, ''),
      content: content.replace(/[<>\"'&]/g, ''),
      language,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 0
    };

    documents.set(documentId, document);
    await saveDocumentToFile(documentId, document);

    res.json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

app.get('/api/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    let document = documents.get(documentId);
    
    if (!document) {
      // Try to load from file
      document = await loadDocumentFromFile(documentId);
      if (document) {
        documents.set(documentId, document);
      }
    }

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const documentList = Array.from(documents.values()).map(doc => ({
      documentId: doc.documentId,
      name: doc.name,
      language: doc.language,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
    
    res.json({ documents: documentList });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// Helper functions
async function getDocumentContent(documentId) {
  try {
    let document = documents.get(documentId);
    
    if (!document) {
      document = await loadDocumentFromFile(documentId);
      if (document) {
        documents.set(documentId, document);
      }
    }
    
    return document?.content || '';
  } catch (error) {
    console.error('Error getting document content:', error);
    return '';
  }
}

async function saveDocumentState(documentId, session) {
  try {
    const document = {
      documentId,
      content: session.content,
      version: session.version,
      updatedAt: Date.now()
    };
    
    documents.set(documentId, { ...documents.get(documentId), ...document });
    await saveDocumentToFile(documentId, documents.get(documentId));
  } catch (error) {
    console.error('Error saving document state:', error);
  }
}

async function saveDocumentToFile(documentId, document) {
  try {
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const filePath = path.join(dataDir, `${documentId}.json`);
    await fs.writeFile(filePath, JSON.stringify(document, null, 2));
  } catch (error) {
    console.error('Error saving document to file:', error);
  }
}

async function loadDocumentFromFile(documentId) {
  try {
    const filePath = path.join(__dirname, 'data', `${documentId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

// Load existing documents on startup
async function loadExistingDocuments() {
  try {
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const files = await fs.readdir(dataDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const documentId = file.replace('.json', '');
        const document = await loadDocumentFromFile(documentId);
        if (document) {
          documents.set(documentId, document);
        }
      }
    }
    
    console.log(`Loaded ${documents.size} existing documents`);
  } catch (error) {
    console.error('Error loading existing documents:', error);
  }
}

const PORT = process.env.PORT || 8080;

// Start server
loadExistingDocuments().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 KRIYA Local Backend Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}`);
  });
});

module.exports = { app, server };