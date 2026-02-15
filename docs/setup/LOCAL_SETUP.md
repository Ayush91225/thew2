# 🚀 KRIYA IDE - Local Setup Guide

Since your AWS account is suspended, this guide will help you run the entire KRIYA IDE locally with full collaboration features.

## 📋 Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Terminal/Command Prompt access

## 🎯 Quick Start (2 Steps)

### Step 1: Start the Backend Server
```bash
cd backend
./start-local.sh
```

### Step 2: Start the Frontend
```bash
# In a new terminal window
npm run dev
```

That's it! Your IDE will be running at `http://localhost:3000` with full collaboration support.

## 📊 What You Get

✅ **Full IDE Experience**
- Monaco Editor with syntax highlighting
- File explorer and management
- Multiple programming languages support
- Command palette (⌘K)
- AI assistant integration

✅ **Real-time Collaboration**
- Multiple users can edit simultaneously
- Live cursor tracking
- Conflict resolution
- User presence indicators

✅ **Local Data Storage**
- Documents saved in `backend/data/`
- No cloud dependencies
- Persistent across restarts

✅ **Development Tools**
- Live server for HTML files
- Code execution for JS/Python
- Terminal integration
- Git status tracking

## 🔧 Manual Setup (If script doesn't work)

### Backend Setup
```bash
cd backend
npm install
node local-server.js
```

### Frontend Setup
```bash
npm install
npm run dev
```

## 🌐 Testing Collaboration

1. Open `http://localhost:3000` in multiple browser tabs
2. Create or open a file
3. Start typing in one tab
4. Watch changes appear in real-time in other tabs
5. See live cursor positions of other users

## 📡 Connection Status

The bottom status bar shows:
- **Backend Connected** (green) - Collaboration is working
- **Backend Offline** (gray) - Only local editing available
- **Backend Error** (red) - Connection issues

Click "Health" to check server status or "Reconnect" if needed.

## 🛠 Troubleshooting

### Backend won't start
```bash
# Check if port 8080 is in use
lsof -ti:8080 | xargs kill -9

# Try starting manually
cd backend
node local-server.js
```

### Frontend can't connect to backend
1. Ensure backend is running on port 8080
2. Check browser console for errors
3. Try refreshing the page
4. Click "Reconnect" in the status bar

### Collaboration not working
1. Check backend status in bottom bar
2. Ensure multiple tabs are on the same document
3. Look for WebSocket connection errors in console

## 📁 File Structure

```
KRIYA/
├── backend/
│   ├── local-server.js     # Main backend server
│   ├── data/              # Document storage
│   ├── package.json       # Backend dependencies
│   └── start-local.sh     # Startup script
├── components/            # React components
├── lib/                  # Utilities and services
└── app/                  # Next.js app structure
```

## 🔄 Data Persistence

- Documents are automatically saved to `backend/data/`
- Each document gets a unique UUID filename
- Data persists between server restarts
- No database setup required

## 🚀 Production Deployment

To deploy without AWS:

1. **Backend**: Deploy to any Node.js host (Heroku, Railway, DigitalOcean)
2. **Frontend**: Deploy to Vercel, Netlify, or any static host
3. **Update config**: Change `BACKEND_URL` in `collaboration-service-real.ts`

## 💡 Features Available

- **Code Editor**: Full Monaco editor with VS Code features
- **File Management**: Create, edit, delete files and folders
- **Live Preview**: HTML files open in browser automatically
- **Code Execution**: Run JavaScript and Python files
- **Search**: Global search across all files
- **Extensions**: Simulated extension system
- **Themes**: Dark theme optimized for coding
- **Shortcuts**: Full keyboard shortcut support

## 🎨 Customization

### Change Backend Port
```bash
PORT=3001 node local-server.js
```

### Update Frontend Connection
Edit `lib/collaboration-service-real.ts`:
```typescript
private readonly BACKEND_URL = 'http://localhost:3001'
```

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Look at backend server logs
3. Verify all dependencies are installed
4. Try restarting both frontend and backend

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Frontend loads at `http://localhost:3000`
- ✅ Backend status shows "Connected" (green)
- ✅ Health check returns "healthy"
- ✅ Multiple tabs can collaborate on the same file
- ✅ Changes sync in real-time between tabs

Enjoy your fully functional local IDE with collaboration features! 🎊