require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const AWS = require('aws-sdk');
const { RateLimiterRedis } = require('rate-limiter-flexible');

const logger = require('./utils/logger');
const redisService = require('./services/redis');
const dynamoService = require('./services/dynamo');

class CollaborationServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = null;
    this.rateLimiter = null;
  }

  async initialize() {
    await this.setupDatabase();
    await this.setupRedis();
    this.setupMiddleware();
    this.setupRateLimiting();
    this.setupSocketIO();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  async setupDatabase() {
    try {
      await dynamoService.initialize();
      logger.info('DynamoDB connected successfully');
    } catch (error) {
      logger.error('DynamoDB connection failed:', error);
      process.exit(1);
    }
  }

  async setupRedis() {
    try {
      await redisService.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Redis connection failed:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRateLimiting() {
    this.rateLimiter = new RateLimiterRedis({
      storeClient: redisService.client,
      keyPrefix: 'rl_',
      points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900
    });
  }

  setupSocketIO() {
    this.io = socketIo(this.server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Redis adapter for clustering
    const redisAdapter = require('socket.io-redis');
    this.io.adapter(redisAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    }));

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', async (socket) => {
      const clientIP = socket.handshake.address;
      logger.info(`Client connected: ${socket.id} from ${clientIP}`);

      // Rate limiting
      try {
        await this.rateLimiter.consume(clientIP);
      } catch (rejRes) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        socket.disconnect();
        return;
      }

      // Authentication middleware
      socket.use(async ([event, ...args], next) => {
        if (event === 'authenticate') return next();
        
        if (!socket.authenticated) {
          return next(new Error('Not authenticated'));
        }
        next();
      });

      // Authentication
      socket.on('authenticate', async (data) => {
        try {
          const { token, userId } = data;
          // Validate token here (JWT or custom validation)
          socket.userId = userId || clientIP;
          socket.authenticated = true;
          socket.emit('authenticated', { userId: socket.userId });
          logger.info(`User authenticated: ${socket.userId}`);
        } catch (error) {
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Document operations
      socket.on('join-document', async (data) => {
        try {
          const { documentId, mode } = data;
          
          // Join socket room
          socket.join(documentId);
          socket.currentDocument = documentId;
          socket.mode = mode;

          if (mode === 'live') {
            // Add to Redis session
            await redisService.joinDocument(documentId, socket.userId, socket.id);
            
            // Subscribe to Redis pub/sub
            await redisService.subscribeToDocument(documentId, (message) => {
              if (message.type === 'operation') {
                socket.to(documentId).emit('operation', message.data);
              } else if (message.type === 'cursor') {
                socket.to(documentId).emit('cursor-update', message.data);
              }
            });

            // Get current collaborators
            const users = await redisService.getDocumentUsers(documentId);
            socket.emit('users-update', users);
            socket.to(documentId).emit('user-joined', {
              userId: socket.userId,
              socketId: socket.id
            });
          }

          // Get document content
          const doc = await dynamoService.getDocument(documentId);
          if (doc) {
            socket.emit('document-content', {
              content: doc.content,
              version: doc.version,
              language: doc.language
            });
          }

          logger.info(`User ${socket.userId} joined document ${documentId} in ${mode} mode`);
        } catch (error) {
          logger.error('Join document error:', error);
          socket.emit('error', { message: 'Failed to join document' });
        }
      });

      socket.on('operation', async (data) => {
        try {
          const { documentId, operation } = data;
          
          if (socket.mode !== 'live' || socket.currentDocument !== documentId) {
            return;
          }

          // Add to operation queue
          await redisService.addOperation(documentId, {
            ...operation,
            userId: socket.userId
          });

          // Publish to other clients
          await redisService.publishOperation(documentId, {
            ...operation,
            userId: socket.userId
          });

          // Update document in database (debounced)
          this.debounceDocumentUpdate(documentId);

          logger.debug(`Operation received from ${socket.userId} for document ${documentId}`);
        } catch (error) {
          logger.error('Operation error:', error);
        }
      });

      socket.on('cursor-update', async (data) => {
        try {
          const { documentId, cursor } = data;
          
          if (socket.mode !== 'live' || socket.currentDocument !== documentId) {
            return;
          }

          await redisService.publishCursor(documentId, {
            userId: socket.userId,
            cursor
          });
        } catch (error) {
          logger.error('Cursor update error:', error);
        }
      });

      socket.on('disconnect', async () => {
        logger.info(`Client disconnected: ${socket.id}`);
        
        if (socket.currentDocument && socket.mode === 'live') {
          await redisService.leaveDocument(socket.currentDocument, socket.userId);
          socket.to(socket.currentDocument).emit('user-left', {
            userId: socket.userId
          });
        }
      });
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Document CRUD API
    this.app.post('/api/documents', async (req, res) => {
      try {
        const { name, content = '', language = 'javascript' } = req.body;
        const userId = req.headers['x-user-id'] || req.ip;
        
        const doc = await dynamoService.createDocument({
          id: require('uuid').v4(),
          name,
          content,
          language,
          createdBy: userId
        });
        
        res.json(doc);
      } catch (error) {
        logger.error('Create document error:', error);
        res.status(500).json({ error: 'Failed to create document' });
      }
    });

    this.app.get('/api/documents/:id', async (req, res) => {
      try {
        const doc = await dynamoService.getDocument(req.params.id);
        if (!doc) {
          return res.status(404).json({ error: 'Document not found' });
        }
        res.json(doc);
      } catch (error) {
        logger.error('Get document error:', error);
        res.status(500).json({ error: 'Failed to get document' });
      }
    });
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  debounceDocumentUpdate(documentId) {
    if (this.updateTimers && this.updateTimers[documentId]) {
      clearTimeout(this.updateTimers[documentId]);
    }
    
    if (!this.updateTimers) this.updateTimers = {};
    
    this.updateTimers[documentId] = setTimeout(async () => {
      try {
        const operations = await redisService.getOperations(documentId, 1000);
        if (operations.length > 0) {
          // Apply operations to document content
          const doc = await dynamoService.getDocument(documentId);
          if (doc) {
            // Apply operations and save
            await dynamoService.updateDocument(documentId, { content: doc.content });
          }
        }
      } catch (error) {
        logger.error('Document update error:', error);
      }
    }, 5000); // 5 second debounce
  }

  async start() {
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    this.server.listen(port, host, () => {
      logger.info(`Server running on ${host}:${port} in ${process.env.NODE_ENV} mode`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  async shutdown() {
    logger.info('Shutting down server...');
    
    this.server.close(() => {
      logger.info('HTTP server closed');
    });
    
    await redisService.disconnect();
    
    process.exit(0);
  }
}

// Start server
const server = new CollaborationServer();
server.initialize().then(() => {
  server.start();
}).catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});