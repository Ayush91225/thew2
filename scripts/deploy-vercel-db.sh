#!/bin/bash

echo "🚀 KRIYA - Vercel Deployment with Database Migration"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set production database URL
export DATABASE_URL="postgres://95d72ee4adf3b9e61184b6523e6ede66b0e0a594b16d39b95caa3fd0b950c28c:sk_ipOln2sa8GGBDNJn8CzCK@db.prisma.io:5432/postgres?sslmode=require"

echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"
npm install

echo -e "${BLUE}📦 Step 2: Generating Prisma Client...${NC}"
npx prisma generate

echo -e "${BLUE}🔄 Step 3: Running database migrations...${NC}"
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Step 4: Verifying database connection...${NC}"
node -e "
const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Connected to Vercel Postgres');
    return prisma.\$disconnect();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection verified${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

echo -e "${BLUE}🏗️  Step 5: Building Next.js application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Step 6: Deploying to Vercel...${NC}"
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo ""
    echo "=================================================="
    echo "🎉 Your application is now live on Vercel!"
    echo "=================================================="
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
