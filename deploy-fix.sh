#!/bin/bash

# Quick fix deployment for file system issue

set -e

echo "🔧 Fixing file system issue and redeploying..."

# Build the app
echo "📦 Building application..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "The file explorer now uses in-memory file tree instead of API calls."
echo "This fixes the 'Failed to list files' error on production."
