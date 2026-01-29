#!/bin/bash

echo "🚀 Deploying KRIYA Collaboration Backend to AWS..."

# Set environment variables
export JWT_SECRET="kriya-collaboration-secret-2024"
export FRONTEND_URL="https://kriya.navchetna.tech"

# Install dependencies
echo "📦 Installing dependencies..."
cd /Users/tanmay/Desktop/KRIYA/thew2/backend/main
npm install

# Copy serverless config
cp ../deployment/serverless.yml .

# Install serverless globally if not present
if ! command -v serverless &> /dev/null; then
    echo "Installing Serverless Framework..."
    npm install -g serverless
fi

# Deploy to AWS
echo "🌩️ Deploying to AWS..."
serverless deploy --stage prod --region ap-south-1

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Note the WebSocket URL from the deployment output"
echo "2. Update frontend environment variables"
echo "3. Test the collaboration features"