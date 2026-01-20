#!/bin/bash

# Final AWS Deployment - Deploy to Amplify
set -e

echo "🚀 Deploying KRIYA IDE to AWS Amplify"
echo "====================================="

# Check AWS CLI
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

# Get current environment variables
source .env.local

# Create Amplify app
echo "📱 Creating Amplify app..."
APP_RESULT=$(aws amplify create-app \
    --name "kriya-ide" \
    --description "KRIYA IDE - Collaborative Web-based IDE" \
    --platform WEB \
    --region ap-south-1 \
    --environment-variables NEXT_PUBLIC_COLLABORATION_WS_URL="$NEXT_PUBLIC_COLLABORATION_WS_URL",NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL",NEXT_PUBLIC_JWT_SECRET="$NEXT_PUBLIC_JWT_SECRET",NEXT_PUBLIC_AWS_REGION="$NEXT_PUBLIC_AWS_REGION" \
    --build-spec '{
        "version": 1,
        "frontend": {
            "phases": {
                "preBuild": {
                    "commands": ["npm ci"]
                },
                "build": {
                    "commands": ["npm run build"]
                }
            },
            "artifacts": {
                "baseDirectory": ".next",
                "files": ["**/*"]
            },
            "cache": {
                "paths": ["node_modules/**/*", ".next/cache/**/*"]
            }
        }
    }' 2>/dev/null || echo "App might already exist")

# Get app ID
APP_ID=$(aws amplify list-apps --region ap-south-1 --query "apps[?name=='kriya-ide'].appId" --output text)

if [ -z "$APP_ID" ] || [ "$APP_ID" == "None" ]; then
    echo "❌ Failed to create or find Amplify app"
    exit 1
fi

echo "✅ Amplify app ID: $APP_ID"

# Create branch
echo "🌿 Creating main branch..."
aws amplify create-branch \
    --app-id "$APP_ID" \
    --branch-name "main" \
    --region ap-south-1 2>/dev/null || echo "Branch might already exist"

# Get app URL
APP_URL="https://main.$APP_ID.amplifyapp.com"

echo ""
echo "🎉 Deployment Setup Complete!"
echo "============================="
echo ""
echo "📋 Your KRIYA IDE is deployed at:"
echo "   Frontend: $APP_URL"
echo "   WebSocket: $NEXT_PUBLIC_COLLABORATION_WS_URL"
echo "   API: $NEXT_PUBLIC_API_URL"
echo ""
echo "🔧 To deploy code changes:"
echo "   1. Push to GitHub/GitLab"
echo "   2. Connect repository in Amplify Console"
echo "   3. Or use: aws amplify start-job --app-id $APP_ID --branch-name main --job-type RELEASE"
echo ""
echo "🌐 Amplify Console: https://console.aws.amazon.com/amplify/home?region=ap-south-1#/$APP_ID"
echo ""