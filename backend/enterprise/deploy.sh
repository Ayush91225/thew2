#!/bin/bash

set -e

echo "🚀 Deploying KRIYA Enterprise Collaboration Backend"

# Configuration
DEPLOY_ENV=${1:-production}
DOMAIN="kriya-api.navchetna.tech"

echo "📋 Environment: $DEPLOY_ENV"
echo "🌐 Domain: $DOMAIN"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Create required directories
mkdir -p logs ssl

# Generate SSL certificates (Let's Encrypt)
if [ ! -f "ssl/cert.pem" ]; then
    echo "🔒 Generating SSL certificates..."
    # In production, use certbot:
    # certbot certonly --standalone -d $DOMAIN
    # For now, create self-signed certificates
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=$DOMAIN"
fi

# Build and start services
echo "🐳 Starting services with Docker Compose..."
docker-compose down
docker-compose build
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3001/health; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Setup PM2 for production (alternative to Docker)
if [ "$DEPLOY_ENV" = "pm2" ]; then
    echo "🔄 Starting with PM2..."
    pm2 delete kriya-collaboration || true
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Monitor logs: docker-compose logs -f app"
echo "🔍 Health check: https://$DOMAIN/health"