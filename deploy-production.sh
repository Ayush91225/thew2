#!/bin/bash

# KRIYA IDE - Production Backend Deployment
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying KRIYA Backend (Production)${NC}"

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

if ! command -v serverless &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Serverless Framework...${NC}"
    npm install -g serverless
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Deploy backend services
echo -e "${BLUE}☁️ Deploying Backend Services${NC}"
cd backend/main

# Install backend dependencies
npm install

# Deploy to AWS
serverless deploy --stage prod --region ap-south-1

# Get endpoints
WEBSOCKET_URL=$(serverless info --stage prod | grep -o 'wss://[^[:space:]]*' | head -1)
API_URL=$(serverless info --stage prod | grep -o 'https://[^[:space:]]*/prod' | head -1)

if [ -z "$WEBSOCKET_URL" ] || [ -z "$API_URL" ]; then
    echo -e "${RED}❌ Failed to get backend URLs${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend deployed successfully${NC}"
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

# Deploy frontend
echo -e "${BLUE}🌐 Deploying Frontend${NC}"

# Check if Amplify app exists
APP_ID=$(aws amplify list-apps --region ap-south-1 --query "apps[?name=='kriya-ide'].appId" --output text 2>/dev/null || echo "")

if [ -z "$APP_ID" ] || [ "$APP_ID" == "None" ]; then
    echo -e "${YELLOW}📱 Creating new Amplify app...${NC}"
    
    APP_RESULT=$(aws amplify create-app \
        --name kriya-ide \
        --description "KRIYA IDE - Production Web-based IDE" \
        --platform WEB \
        --region ap-south-1 \
        --environment-variables NEXT_PUBLIC_COLLABORATION_WS_URL=$WEBSOCKET_URL,NEXT_PUBLIC_API_URL=$API_URL,NEXT_PUBLIC_JWT_SECRET=kriya-collaboration-secret-2024,NEXT_PUBLIC_AWS_REGION=ap-south-1)
    
    APP_ID=$(echo $APP_RESULT | grep -o '"appId":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Amplify app created: $APP_ID${NC}"
else
    echo -e "${GREEN}✅ Using existing Amplify app: $APP_ID${NC}"
    
    # Update environment variables
    aws amplify update-app \
        --app-id $APP_ID \
        --environment-variables NEXT_PUBLIC_COLLABORATION_WS_URL=$WEBSOCKET_URL,NEXT_PUBLIC_API_URL=$API_URL,NEXT_PUBLIC_JWT_SECRET=kriya-collaboration-secret-2024,NEXT_PUBLIC_AWS_REGION=ap-south-1 \
        --region ap-south-1
fi

# Create deployment
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
zip -r deployment.zip .next package.json amplify.yml -x "*.git*" "node_modules/*" "backend/*"

DEPLOYMENT_RESULT=$(aws amplify create-deployment --app-id $APP_ID --branch-name main --region ap-south-1)
UPLOAD_URL=$(echo $DEPLOYMENT_RESULT | grep -o '"zipUploadUrl":"[^"]*' | cut -d'"' -f4 | sed 's/\\//g')

echo -e "${YELLOW}📤 Uploading deployment...${NC}"
curl -X PUT "$UPLOAD_URL" --data-binary @deployment.zip -H "Content-Type: application/zip"

echo -e "${YELLOW}🚀 Starting deployment...${NC}"
JOB_ID=$(echo $DEPLOYMENT_RESULT | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)
aws amplify start-deployment --app-id $APP_ID --branch-name main --job-id $JOB_ID --region ap-south-1

# Get app URL
APP_URL="https://main.$APP_ID.amplifyapp.com"

# Update backend with frontend URL
echo -e "${YELLOW}🔗 Updating backend with frontend URL...${NC}"
cd backend/main
serverless deploy --stage prod --region ap-south-1 --param="frontendUrl=$APP_URL"

# Cleanup
cd ../../
rm -f deployment.zip

echo ""
echo -e "${GREEN}🎉 PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo "=========================="
echo ""
echo -e "${BLUE}📋 Production URLs:${NC}"
echo -e "${GREEN}   Frontend:     $APP_URL${NC}"
echo -e "${GREEN}   WebSocket:    $WEBSOCKET_URL${NC}"
echo -e "${GREEN}   API:          $API_URL${NC}"
echo ""
echo -e "${BLUE}🔧 Management:${NC}"
echo "   Monitor logs: aws logs tail /aws/lambda/kriya-collaboration-prod-websocket --follow"
echo "   Amplify console: https://console.aws.amazon.com/amplify/home?region=ap-south-1#/$APP_ID"
echo ""
echo -e "${YELLOW}⚠️  Note: Real database connections are now enabled.${NC}"
echo -e "${YELLOW}   Configure database credentials in AWS Systems Manager Parameter Store.${NC}"
echo ""