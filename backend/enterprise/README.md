# KRIYA Enterprise Collaboration Backend

## Architecture Overview

### Core Components
- **WebSocket Server**: Native Socket.IO server with clustering support
- **Redis**: Session management, pub/sub, and operation queuing
- **DynamoDB**: Document persistence and metadata storage
- **Nginx**: Load balancer with SSL termination
- **Docker**: Containerized deployment

### Key Features
- ✅ Horizontal scaling with clustering
- ✅ Redis-based session management
- ✅ DynamoDB for document persistence
- ✅ Rate limiting and security
- ✅ SSL/TLS encryption
- ✅ Health monitoring
- ✅ Graceful shutdown

## Deployment

### Quick Start
```bash
cd backend/enterprise
cp .env.example .env
# Edit .env with your AWS credentials
./deploy.sh
```

### Docker Deployment
```bash
docker-compose up -d
```

### PM2 Deployment
```bash
npm install
./deploy.sh pm2
```

## Configuration

### Environment Variables
```bash
# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://kriya.navchetna.tech
```

## API Endpoints

### WebSocket Events
- `authenticate` - User authentication
- `join-document` - Join collaboration session
- `operation` - Text operations
- `cursor-update` - Cursor position updates

### REST API
- `POST /api/documents` - Create document
- `GET /api/documents/:id` - Get document
- `GET /health` - Health check

## Monitoring

### Logs
```bash
# Docker logs
docker-compose logs -f app

# PM2 logs
pm2 logs kriya-collaboration
```

### Health Check
```bash
curl https://kriya-api.navchetna.tech/health
```

## Security Features
- Rate limiting (100 req/15min per IP)
- CORS protection
- Helmet security headers
- SSL/TLS encryption
- Input validation
- Authentication middleware