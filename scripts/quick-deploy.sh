#!/bin/bash

# Quick Deploy to Vercel with Database Check
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 KRIYA Quick Deploy${NC}"
echo ""

# Check if DATABASE_URL is set in Vercel
echo -e "${YELLOW}Checking Vercel environment...${NC}"

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not installed${NC}"
    echo "Install: npm i -g vercel"
    exit 1
fi

# Build
echo -e "${YELLOW}🔨 Building...${NC}"
npm run build

# Check Prisma
echo -e "${YELLOW}📊 Checking database schema...${NC}"
npx prisma generate

# Deploy
echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "1. Set DATABASE_URL in Vercel dashboard if not done"
echo "2. Run migrations: vercel env pull && npx prisma migrate deploy"
echo ""
echo -e "${BLUE}Check your app:${NC}"
vercel ls | head -5
echo ""
