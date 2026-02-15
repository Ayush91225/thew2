# KRIYA Backend Architecture Analysis

## 🔍 Executive Summary

**YES, the app has MULTIPLE backend implementations** serving different purposes:

1. **Local Development Backend** - For offline/local development
2. **AWS Production Backend** - Serverless production deployment
3. **Enterprise Backend** - Enterprise-grade with Redis, clustering
4. **Simple WebSocket Server** - Alternative lightweight implementation
5. **AWS WebSocket Infrastructure** - CDK-based AWS infrastructure

---

## 📊 Backend Implementations Overview

### 1. **Local Development Backend** 
**Location**: `backend/local-server.js`  
**Port**: 8080  
**Purpose**: Local development without AWS dependencies

#### Features:
- ✅ Express.js + Socket.IO
- ✅ Local file storage (JSON files)
- ✅ No AWS dependencies
- ✅ CORS configured for localhost:3000 and production domain
- ✅ Health check endpoint
- ✅ Document collaboration
- ✅ Real-time WebSocket support

#### Configuration:
```javascript
// CORS configured for:
- http://localhost:3000
- https://kriya.navchetna.tech
```

#### Dependencies:
- `express`: ^4.18.2
- `socket.io`: ^4.7.4
- `cors`: ^2.8.5
- `uuid`: ^9.0.1

#### Usage:
```bash
cd backend
node local-server.js
# or
./start-local.sh
```

---

### 2. **AWS Production Backend (Main)**
**Location**: `backend/main/server.js`  
**Purpose**: Production-ready serverless backend

#### Features:
- ✅ Express.js + Socket.IO
- ✅ AWS SDK integration (DynamoDB)
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CSRF protection
- ✅ Helmet security
- ✅ Input validation
- ✅ Serverless deployment ready

#### AWS Services:
- **DynamoDB**: Document and session storage
- **API Gateway**: REST and WebSocket APIs
- **Lambda**: Serverless functions
- **Region**: ap-south-1 (Mumbai)

#### Configuration:
```javascript
// AWS Configuration
AWS.config.update({ region: 'ap-south-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Frontend URL
FRONTEND_URL: "https://kriya.navchetna.tech"
```

#### Deployment:
- **Serverless Framework**: `backend/main/serverless.yml`
- **Runtime**: Node.js 20.x
- **Functions**: WebSocket + REST API handlers

---

### 3. **Enterprise Backend**
**Location**: `backend/enterprise/src/server.js`  
**Purpose**: Enterprise-grade production backend with advanced features

#### Features:
- ✅ Express.js + Socket.IO
- ✅ **Redis** integration (caching, pub/sub)
- ✅ **DynamoDB** integration
- ✅ **Clustering** support (PM2)
- ✅ **Winston** logging with daily rotation
- ✅ **Rate limiting** with Redis
- ✅ **Docker** support
- ✅ **Nginx** reverse proxy configuration
- ✅ **PM2** process management
- ✅ **Joi** validation
- ✅ Compression middleware

#### Architecture:
```javascript
class CollaborationServer {
  - setupDatabase()      // DynamoDB
  - setupRedis()         // Redis connection
  - setupMiddleware()     // Express middleware
  - setupRateLimiting()  // Redis-based rate limiting
  - setupSocketIO()      // Socket.IO with Redis adapter
  - setupRoutes()        // API routes
  - setupErrorHandling() // Error handling
}
```

#### Services:
- `services/redis.js` - Redis connection and operations
- `services/dynamo.js` - DynamoDB operations
- `utils/logger.js` - Winston logger

#### Deployment Options:
1. **Docker**: `docker-compose.yml` provided
2. **PM2**: `ecosystem.config.js` for process management
3. **Cluster Mode**: `cluster.js` for multi-core utilization

#### Dependencies:
- `redis`: ^4.6.10
- `ioredis`: ^5.3.2
- `socket.io-redis`: ^6.1.1
- `winston`: ^3.11.0
- `pm2`: ^5.3.0
- `aws-sdk`: ^2.1490.0

---

### 4. **Simple WebSocket Server**
**Location**: `backend/websocket-server.js`  
**Port**: 8082  
**Purpose**: Lightweight WebSocket-only server

#### Features:
- ✅ Native WebSocket (ws library)
- ✅ Simple message handling
- ✅ Document session management
- ✅ No HTTP server overhead

#### Usage:
```javascript
// Simple WebSocket server
const wss = new WebSocket.Server({ port: 8082 });
```

---

### 5. **AWS WebSocket Infrastructure (CDK)**
**Location**: `backend/aws-websocket/`  
**Purpose**: AWS CDK infrastructure for WebSocket API Gateway

#### Components:
- **CDK Stack**: `lib/kriya-websocket-stack.ts`
- **Lambda Functions**:
  - `lambda/connect.js` - WebSocket connection handler
  - `lambda/disconnect.js` - WebSocket disconnection handler
  - `lambda/message.js` - WebSocket message handler

#### Infrastructure:
- **API Gateway WebSocket**: `wss://xtc3torv9c.execute-api.ap-south-1.amazonaws.com/prod`
- **DynamoDB Tables**: Documents and sessions
- **Lambda Functions**: Serverless WebSocket handlers

#### Deployment:
```bash
cd backend/aws-websocket
npm run deploy  # CDK deploy
```

---

## 🔄 Backend Connection Flow

### Frontend Configuration
**File**: `lib/backend-client.ts`

```typescript
const backendClient = new BackendClient({
  // REST API URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 
    'https://1ngwyksutc.execute-api.ap-south-1.amazonaws.com/prod',
  
  // WebSocket URL
  wsUrl: process.env.NEXT_PUBLIC_COLLABORATION_WS_URL || 
    'wss://xtc3torv9c.execute-api.ap-south-1.amazonaws.com/prod'
})
```

### Environment-Based Selection

#### Development (Local):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_COLLABORATION_WS_URL=ws://localhost:8080
```
→ Uses `backend/local-server.js`

#### Production (AWS):
```bash
NEXT_PUBLIC_API_URL=https://1ngwyksutc.execute-api.ap-south-1.amazonaws.com/prod
NEXT_PUBLIC_COLLABORATION_WS_URL=wss://xtc3torv9c.execute-api.ap-south-1.amazonaws.com/prod
```
→ Uses AWS Lambda + API Gateway

---

## 📁 Backend Directory Structure

```
backend/
├── local-server.js          # Local development server (port 8080)
├── websocket-server.js      # Simple WebSocket server (port 8082)
├── package.json             # Local backend dependencies
│
├── main/                    # AWS Production Backend
│   ├── server.js            # Main server with AWS SDK
│   ├── api.js               # REST API handlers
│   ├── websocket.js         # WebSocket handlers
│   ├── serverless.yml       # Serverless config
│   └── package.json
│
├── enterprise/              # Enterprise Backend
│   ├── src/
│   │   ├── server.js        # Enterprise server class
│   │   ├── cluster.js       # Cluster mode
│   │   ├── services/
│   │   │   ├── redis.js     # Redis service
│   │   │   └── dynamo.js    # DynamoDB service
│   │   └── utils/
│   │       └── logger.js    # Winston logger
│   ├── ecosystem.config.js  # PM2 config
│   ├── docker-compose.yml   # Docker setup
│   ├── Dockerfile           # Docker image
│   └── package.json
│
├── aws-websocket/           # AWS CDK Infrastructure
│   ├── lib/
│   │   └── kriya-websocket-stack.ts  # CDK stack
│   ├── lambda/
│   │   ├── connect.js       # Connection handler
│   │   ├── disconnect.js    # Disconnection handler
│   │   └── message.js       # Message handler
│   ├── bin/
│   │   └── app.ts           # CDK app entry
│   └── package.json
│
└── deployment/              # Deployment configs
    ├── serverless.yml       # Alternative serverless config
    └── deploy.sh            # Deployment script
```

---

## 🎯 Backend Selection Matrix

| Backend | Environment | Use Case | Storage | Scalability | Dependencies |
|---------|------------|----------|---------|-------------|--------------|
| **Local Server** | Development | Local dev, testing | Local files | Single instance | None (offline) |
| **Main Server** | Production | AWS serverless | DynamoDB | Auto-scaling | AWS SDK |
| **Enterprise** | Production | High-traffic, enterprise | DynamoDB + Redis | Clustering | AWS + Redis |
| **WebSocket Server** | Development | Lightweight testing | In-memory | Single instance | ws library |
| **AWS CDK** | Production | Infrastructure as code | DynamoDB | Auto-scaling | AWS CDK |

---

## 🔌 API Endpoints Comparison

### Local Server (`localhost:8080`)
- `GET /health` - Health check
- `POST /api/documents` - Create document
- `GET /api/documents/:id` - Get document
- `GET /api/documents` - List documents
- `WebSocket /` - Real-time collaboration

### AWS Production
- `GET /health` - Health check
- `POST /api/documents` - Create document (DynamoDB)
- `GET /api/documents/:id` - Get document (DynamoDB)
- `GET /api/documents` - List documents (DynamoDB)
- `WebSocket @connections/*` - Real-time collaboration

### Enterprise
- All of the above +
- Redis caching
- Rate limiting
- Clustering support
- Advanced logging

---

## 🚀 Deployment Scenarios

### Scenario 1: Local Development
```bash
# Start local backend
cd backend
node local-server.js

# Frontend connects to: http://localhost:8080
```

### Scenario 2: AWS Production (Serverless)
```bash
# Deploy to AWS
cd backend/main
serverless deploy

# Frontend connects to AWS API Gateway
```

### Scenario 3: Enterprise Deployment
```bash
# Option 1: Docker
cd backend/enterprise
docker-compose up -d

# Option 2: PM2
pm2 start ecosystem.config.js

# Option 3: Cluster mode
node src/cluster.js
```

### Scenario 4: AWS CDK Infrastructure
```bash
# Deploy infrastructure
cd backend/aws-websocket
npm run deploy
```

---

## 🔍 Key Differences

### Local vs Production

| Feature | Local Server | AWS Production | Enterprise |
|---------|-------------|----------------|------------|
| **Storage** | Local JSON files | DynamoDB | DynamoDB + Redis |
| **Caching** | None | None | Redis |
| **Scaling** | Single instance | Auto-scaling | Clustering |
| **Logging** | Console | CloudWatch | Winston (files) |
| **Rate Limiting** | None | Express rate limit | Redis-based |
| **Authentication** | Basic | JWT | JWT + Redis sessions |
| **Monitoring** | None | CloudWatch | Winston + PM2 |

---

## 📊 Backend 2 Directory

**Location**: `backend 2/`

**Status**: ⚠️ **Incomplete/Backup**

This appears to be a backup or incomplete copy of the backend. It contains:
- Partial `node_modules` directories
- Incomplete structure
- No active server files
- Likely a backup or work-in-progress

**Recommendation**: Can be safely ignored or removed if not needed.

---

## 🎯 Recommendations

### For Development:
✅ Use `backend/local-server.js` (port 8080)

### For Production (Small Scale):
✅ Use `backend/main/server.js` with Serverless Framework

### For Production (Enterprise):
✅ Use `backend/enterprise/src/server.js` with Redis and clustering

### For Infrastructure:
✅ Use `backend/aws-websocket/` CDK stack for AWS deployment

---

## 🔐 Security Considerations

### Local Server:
- ⚠️ No authentication (development only)
- ⚠️ Local file storage (not secure)
- ✅ CORS protection

### AWS Production:
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CSRF protection
- ✅ Helmet security
- ✅ Input validation

### Enterprise:
- ✅ All AWS security features +
- ✅ Redis-based rate limiting
- ✅ Advanced logging
- ✅ Session management
- ✅ Docker security

---

## 📈 Performance Comparison

| Backend | Latency | Throughput | Scalability | Cost |
|---------|---------|------------|-------------|------|
| **Local** | Low (local) | Limited | Single instance | Free |
| **AWS Main** | Medium (AWS) | High | Auto-scaling | Pay-per-use |
| **Enterprise** | Low (cached) | Very High | Clustering | Higher cost |
| **WebSocket** | Low | Limited | Single instance | Free |

---

## ✅ Conclusion

**YES, the app has MULTIPLE backend implementations:**

1. **Local Development Backend** - For offline development
2. **AWS Production Backend** - Serverless production deployment
3. **Enterprise Backend** - High-traffic enterprise deployment
4. **Simple WebSocket Server** - Lightweight alternative
5. **AWS CDK Infrastructure** - Infrastructure as code

Each serves a specific purpose:
- **Development**: Local server
- **Production (Standard)**: AWS serverless
- **Production (Enterprise)**: Enterprise backend with Redis/clustering
- **Infrastructure**: CDK for AWS deployment

The frontend automatically selects the backend based on environment variables, allowing seamless switching between development and production environments.

---

**Analysis Date**: 2024  
**Status**: ✅ Complete

