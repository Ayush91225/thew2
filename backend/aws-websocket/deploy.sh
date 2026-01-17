#!/bin/bash

set -e

echo "🚀 Deploying KRIYA WebSocket Infrastructure"

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy with CDK
cdk bootstrap
cdk deploy --require-approval never

# Get WebSocket URL
WEBSOCKET_URL=$(aws cloudformation describe-stacks \
  --stack-name KriyaWebSocketStack \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketURL`].OutputValue' \
  --output text)

echo "✅ Deployment completed!"
echo "🔗 WebSocket URL: $WEBSOCKET_URL"
echo ""
echo "Update your frontend with:"
echo "NEXT_PUBLIC_COLLABORATION_WS_URL=$WEBSOCKET_URL"