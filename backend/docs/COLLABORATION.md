# KRIYA Real-Time Collaboration System

## Overview
The KRIYA IDE features a sophisticated real-time collaboration system that allows multiple developers to work on the same codebase simultaneously, similar to Google Docs but optimized for code editing.

## Architecture

### Backend Infrastructure (AWS)
- **WebSocket API Gateway**: Handles real-time connections
- **Lambda Functions**: Process collaboration events
- **DynamoDB**: Stores documents and session data
- **Region**: ap-south-1 (Mumbai)

### Frontend Integration
- **Socket.IO Client**: Real-time communication
- **Monaco Editor**: Enhanced with collaboration features
- **Operational Transformation**: Conflict resolution

## Features

### Solo Mode
- Traditional single-user editing
- No network overhead
- Full offline capability
- Local file operations

### Live Mode
- Real-time collaborative editing
- Live cursor tracking
- User presence indicators
- Conflict-free concurrent editing
- Automatic synchronization

## API Endpoints

### WebSocket Events
- `join-document`: Join a document session
- `operation`: Send text operations
- `cursor-update`: Update cursor position
- `user-joined`: User joined notification
- `user-left`: User left notification

### REST API
- `POST /api/documents`: Create new document
- `GET /api/documents/:id`: Get document content
- `GET /api/documents`: List all documents

## Usage

### Toggle Between Modes
```typescript
// In TopBar component
const toggleCollaboration = async () => {
  const newMode = collab ? 'solo' : 'live'
  collaborationService.joinDocument(activeTab, newMode)
  setCollab(!collab)
}
```

### Real-time Operations
```typescript
// Text changes are automatically synchronized
editor.onDidChangeModelContent((e) => {
  if (collab) {
    const operation = createOperation(e.changes[0])
    collaborationService.sendOperation(operation)
  }
})
```

### Cursor Tracking
```typescript
// Cursor positions are shared in real-time
editor.onDidChangeCursorPosition((e) => {
  if (collab) {
    collaborationService.updateCursor(
      e.position.lineNumber, 
      e.position.column
    )
  }
})
```

## Deployment

### Backend Deployment
```bash
cd backend/main
npm install
serverless deploy --stage prod --region ap-south-1
```

### Frontend Configuration
```env
NEXT_PUBLIC_COLLABORATION_WS_URL=wss://xtc3torv9c.execute-api.ap-south-1.amazonaws.com/prod
NEXT_PUBLIC_COLLABORATION_API_URL=https://1ngwyksutc.execute-api.ap-south-1.amazonaws.com/prod
```

## Security
- JWT-based authentication
- Rate limiting
- CORS protection
- Input validation
- Session management

## Performance
- Optimized for low latency
- Efficient operation batching
- Minimal network overhead
- Smart conflict resolution

## Monitoring
- CloudWatch logs
- Real-time metrics
- Error tracking
- Performance monitoring