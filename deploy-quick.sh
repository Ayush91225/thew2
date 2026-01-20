#!/bin/bash

# Quick AWS Deployment Script for KRIYA IDE
set -e

echo "🚀 Quick AWS Deployment for KRIYA IDE"
echo "====================================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

# Deploy backend first
echo "☁️ Deploying backend..."
cd backend/main

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Deploy serverless
serverless deploy --stage prod

# Get endpoints
WEBSOCKET_URL=$(serverless info --stage prod | grep -o 'wss://[^[:space:]]*' | head -1)
API_URL=$(serverless info --stage prod | grep -o 'https://[^[:space:]]*/prod' | head -1)

echo "✅ Backend deployed"
echo "   WebSocket: $WEBSOCKET_URL"
echo "   API: $API_URL"

# Update environment
cd ../../
cat > .env.local << EOF
NEXT_PUBLIC_COLLABORATION_WS_URL=$WEBSOCKET_URL
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_JWT_SECRET=kriya-collaboration-secret-2024
NEXT_PUBLIC_AWS_REGION=ap-south-1
EOF

# Build frontend
echo "🏗️ Building frontend..."
npm run build

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo "WebSocket URL: $WEBSOCKET_URL"
echo "API URL: $API_URL"
echo ""
echo "Next steps:"
echo "1. Deploy to Amplify: aws amplify create-app --name kriya-ide"
echo "2. Or use Vercel: vercel --prod"
echo ""