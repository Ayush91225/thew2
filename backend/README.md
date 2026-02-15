# KRIYA Local Backend Setup

Since your AWS account is suspended, this local backend server provides all the collaboration features without requiring AWS services.

## Quick Start

### Option 1: Full stack (frontend + backend from repo root)
```bash
./scripts/start-full-stack.sh
```

### Option 2: Backend only – startup script
```bash
cd backend
./start-local.sh
```

### Option 3: Manual setup
```bash
cd backend
npm install
node local-server.js
```

## What this provides

✅ **Real-time collaboration** - Multiple users can edit the same document simultaneously  
✅ **Document persistence** - Documents are saved locally in the `data/` folder  
✅ **WebSocket support** - Live cursor tracking and text operations  
✅ **No AWS dependencies** - Works completely offline  
✅ **Health monitoring** - Check server status at http://localhost:8080/health  

## Server Details

- **Port**: 8080 (configurable via PORT environment variable)
- **Frontend connection**: The frontend will automatically connect to `http://localhost:8080`
- **Data storage**: Local JSON files in `backend/data/` directory
- **CORS**: Configured for both localhost:3000 and your production domain

## API Endpoints

- `GET /health` - Server health check
- `POST /api/documents` - Create new document
- `GET /api/documents/:id` - Get document by ID
- `GET /api/documents` - List all documents
- `WebSocket /` - Real-time collaboration

## Troubleshooting

### Port already in use
```bash
# Kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

### Frontend not connecting
1. Make sure backend is running on port 8080
2. Check browser console for connection errors
3. Verify CORS settings in `local-server.js`

### Data not persisting
- Check if `backend/data/` directory exists and is writable
- Look for error messages in the server console

## Production Deployment

For production, you can:
1. Deploy this server to any Node.js hosting service (Heroku, Railway, etc.)
2. Update the `BACKEND_URL` in `collaboration-service-real.ts`
3. Set up a proper database (PostgreSQL, MongoDB) instead of JSON files

## Features

- **Multi-tab collaboration**: Multiple browser tabs can collaborate on the same document
- **Conflict resolution**: Basic operational transformation for concurrent edits
- **User presence**: See who else is editing the document
- **Cursor tracking**: Real-time cursor position sharing
- **Auto-save**: Documents are automatically saved as you type

## Next Steps

1. Start the backend server: `./start-local.sh`
2. Start your frontend: `npm run dev`
3. Open multiple browser tabs to test collaboration
4. Check the health endpoint: http://localhost:8080/health

The server will create a `data/` directory to store documents locally. Each document is saved as a JSON file with its UUID as the filename.