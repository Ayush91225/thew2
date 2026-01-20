#!/bin/bash

# Real-Time Collaboration Deployment Script
# This script deploys the updated backend with real-time synchronization fixes

set -e

echo "🚀 Deploying Real-Time Collaboration Backend..."

# Navigate to backend directory
cd "$(dirname "$0")/backend/main"

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework not found. Installing..."
    npm install -g serverless
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to AWS
echo "☁️ Deploying to AWS..."
serverless deploy --stage prod

# Get the WebSocket endpoint
echo "🔗 Getting WebSocket endpoint..."
WEBSOCKET_URL=$(serverless info --stage prod | grep -o 'wss://[^[:space:]]*')

if [ -n "$WEBSOCKET_URL" ]; then
    echo "✅ WebSocket URL: $WEBSOCKET_URL"
    
    # Update the .env.local file
    cd ../../
    if [ -f ".env.local" ]; then
        # Update existing .env.local
        sed -i.bak "s|NEXT_PUBLIC_COLLABORATION_WS_URL=.*|NEXT_PUBLIC_COLLABORATION_WS_URL=$WEBSOCKET_URL|" .env.local
        echo "✅ Updated .env.local with new WebSocket URL"
    else
        # Create new .env.local
        echo "NEXT_PUBLIC_COLLABORATION_WS_URL=$WEBSOCKET_URL" > .env.local
        echo "NEXT_PUBLIC_JWT_SECRET=kriya-collaboration-secret-2024" >> .env.local
        echo "✅ Created .env.local with WebSocket URL"
    fi
else
    echo "❌ Failed to get WebSocket URL from deployment"
    exit 1
fi

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Restart your Next.js development server"
echo "2. Enable collaboration mode in the IDE"
echo "3. Open multiple browser windows to test real-time sync"
echo "4. Use the test file: test-collaboration-realtime.html"
echo ""
echo "🔧 WebSocket Endpoint: $WEBSOCKET_URL"
echo ""
echo "🧪 Test Commands:"
echo "  npm run dev                    # Start development server"
echo "  open test-collaboration-realtime.html  # Test collaboration"
echo ""