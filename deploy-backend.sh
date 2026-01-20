#!/bin/bash

# KRIYA Backend Deployment Script
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying KRIYA Backend to AWS${NC}"

# Deploy backend
cd backend/main
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🚀 Deploying to AWS...${NC}"
serverless deploy --stage prod --region ap-south-1

# Get endpoints
WEBSOCKET_URL="wss://xtc3torv9c.execute-api.ap-south-1.amazonaws.com/prod"
API_URL="https://1ngwyksutc.execute-api.ap-south-1.amazonaws.com/prod"

echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
echo -e "${GREEN}   WebSocket URL: $WEBSOCKET_URL${NC}"
echo -e "${GREEN}   API URL: $API_URL${NC}"

# Update environment variables
cd ../../
cat > .env.local << EOF
NEXT_PUBLIC_COLLABORATION_WS_URL=$WEBSOCKET_URL
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_JWT_SECRET=kriya-collaboration-secret-2024
NEXT_PUBLIC_AWS_REGION=ap-south-1
EOF

echo -e "${GREEN}✅ Environment variables updated${NC}"
echo -e "${BLUE}🎉 Backend deployment complete!${NC}"