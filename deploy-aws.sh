#!/bin/bash

# KRIYA IDE - Complete AWS Deployment Script
# This script deploys both frontend and backend to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="ap-south-1"
BACKEND_STAGE="prod"
APP_NAME="kriya-ide"

echo -e "${BLUE}🚀 Starting KRIYA IDE AWS Deployment${NC}"
echo "=================================="

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    echo "Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Check Serverless Framework
if ! command -v serverless &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Serverless Framework...${NC}"
    npm install -g serverless
fi

# Check Amplify CLI
if ! command -v amplify &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Amplify CLI...${NC}"
    npm install -g @aws-amplify/cli
fi

echo -e "${GREEN}✅ Prerequisites check complete${NC}"

# Step 1: Deploy Backend
echo -e "${BLUE}☁️ Step 1: Deploying Backend Services${NC}"
echo "======================================"

cd backend/main

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
npm install

# Deploy serverless backend
echo -e "${YELLOW}🚀 Deploying serverless functions...${NC}"
serverless deploy --stage $BACKEND_STAGE --region $AWS_REGION

# Get WebSocket URL
echo -e "${YELLOW}🔗 Retrieving WebSocket endpoint...${NC}"
WEBSOCKET_URL=$(serverless info --stage $BACKEND_STAGE | grep -o 'wss://[^[:space:]]*' | head -1)

# Get API URL  
echo -e "${YELLOW}🔗 Retrieving API endpoint...${NC}"
API_URL=$(serverless info --stage $BACKEND_STAGE | grep -o 'https://[^[:space:]]*/prod' | head -1)

if [ -z "$WEBSOCKET_URL" ]; then
    echo -e "${RED}❌ Failed to get WebSocket URL${NC}"
    exit 1
fi

if [ -z "$API_URL" ]; then
    echo -e "${RED}❌ Failed to get API URL${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend deployed successfully${NC}"
echo -e "${GREEN}   WebSocket URL: $WEBSOCKET_URL${NC}"
echo -e "${GREEN}   API URL: $API_URL${NC}"

# Step 2: Update Environment Variables
echo -e "${BLUE}🔧 Step 2: Updating Environment Variables${NC}"
echo "=========================================="

cd ../../

# Create/update .env.local
cat > .env.local << EOF
NEXT_PUBLIC_COLLABORATION_WS_URL=$WEBSOCKET_URL
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_JWT_SECRET=kriya-collaboration-secret-2024
NEXT_PUBLIC_AWS_REGION=$AWS_REGION
EOF

echo -e "${GREEN}✅ Environment variables updated${NC}"

# Step 3: Build Frontend
echo -e "${BLUE}🏗️ Step 3: Building Frontend${NC}"
echo "============================="

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

# Build the application
echo -e "${YELLOW}🔨 Building Next.js application...${NC}"
npm run build

echo -e "${GREEN}✅ Frontend build complete${NC}"

# Step 4: Deploy to Amplify
echo -e "${BLUE}☁️ Step 4: Deploying to AWS Amplify${NC}"
echo "===================================="

# Check if Amplify app exists
APP_ID=$(aws amplify list-apps --region $AWS_REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -z "$APP_ID" ] || [ "$APP_ID" == "None" ]; then
    echo -e "${YELLOW}📱 Creating new Amplify app...${NC}"
    
    # Create Amplify app
    APP_RESULT=$(aws amplify create-app \
        --name $APP_NAME \
        --description "KRIYA IDE - Collaborative Web-based IDE" \
        --platform WEB \
        --region $AWS_REGION \
        --environment-variables NEXT_PUBLIC_COLLABORATION_WS_URL=$WEBSOCKET_URL,NEXT_PUBLIC_API_URL=$API_URL,NEXT_PUBLIC_JWT_SECRET=kriya-collaboration-secret-2024,NEXT_PUBLIC_AWS_REGION=$AWS_REGION)
    
    APP_ID=$(echo $APP_RESULT | grep -o '"appId":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$APP_ID" ]; then
        echo -e "${RED}❌ Failed to create Amplify app${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Amplify app created with ID: $APP_ID${NC}"
else
    echo -e "${GREEN}✅ Using existing Amplify app: $APP_ID${NC}"
    
    # Update environment variables
    aws amplify update-app \
        --app-id $APP_ID \
        --environment-variables NEXT_PUBLIC_COLLABORATION_WS_URL=$WEBSOCKET_URL,NEXT_PUBLIC_API_URL=$API_URL,NEXT_PUBLIC_JWT_SECRET=kriya-collaboration-secret-2024,NEXT_PUBLIC_AWS_REGION=$AWS_REGION \
        --region $AWS_REGION
fi

# Create branch if it doesn't exist
BRANCH_NAME="main"
BRANCH_EXISTS=$(aws amplify list-branches --app-id $APP_ID --region $AWS_REGION --query "branches[?branchName=='$BRANCH_NAME'].branchName" --output text 2>/dev/null || echo "")

if [ -z "$BRANCH_EXISTS" ] || [ "$BRANCH_EXISTS" == "None" ]; then
    echo -e "${YELLOW}🌿 Creating main branch...${NC}"
    aws amplify create-branch \
        --app-id $APP_ID \
        --branch-name $BRANCH_NAME \
        --region $AWS_REGION
fi

# Get the Amplify app URL
APP_URL="https://$BRANCH_NAME.$APP_ID.amplifyapp.com"

echo -e "${GREEN}✅ Amplify deployment configured${NC}"

# Step 5: Final Configuration
echo -e "${BLUE}🔧 Step 5: Final Configuration${NC}"
echo "==============================="

# Update backend with frontend URL
cd backend/main
serverless deploy --stage $BACKEND_STAGE --region $AWS_REGION --param="frontendUrl=$APP_URL"

echo -e "${GREEN}✅ Backend updated with frontend URL${NC}"

# Deployment Summary
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "========================"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "${GREEN}   Frontend URL:    $APP_URL${NC}"
echo -e "${GREEN}   WebSocket URL:   $WEBSOCKET_URL${NC}"
echo -e "${GREEN}   API URL:         $API_URL${NC}"
echo -e "${GREEN}   AWS Region:      $AWS_REGION${NC}"
echo -e "${GREEN}   Amplify App ID:  $APP_ID${NC}"
echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "1. Visit your app: $APP_URL"
echo "2. Test collaboration features"
echo "3. Monitor logs: aws logs tail /aws/lambda/kriya-collaboration-$BACKEND_STAGE-websocket --follow"
echo "4. View Amplify console: https://console.aws.amazon.com/amplify/home?region=$AWS_REGION#/$APP_ID"
echo ""
echo -e "${BLUE}🛠️ Useful Commands:${NC}"
echo "   Update backend:  cd backend/main && serverless deploy --stage $BACKEND_STAGE"
echo "   View logs:       serverless logs -f websocket --stage $BACKEND_STAGE"
echo "   Redeploy frontend: aws amplify start-job --app-id $APP_ID --branch-name $BRANCH_NAME --job-type RELEASE"
echo ""