#!/bin/bash

# KRIYA - Database Deployment Guide
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🗄️  KRIYA Database Deployment${NC}"
echo ""

echo -e "${YELLOW}Choose your database provider:${NC}"
echo "1. Vercel Postgres (Recommended - easiest)"
echo "2. AWS RDS PostgreSQL"
echo "3. Supabase (Free tier)"
echo "4. Neon (Serverless)"
echo ""

read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo -e "${BLUE}📦 Setting up Vercel Postgres${NC}"
    echo ""
    echo -e "${YELLOW}Steps:${NC}"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Storage tab"
    echo "4. Click 'Create Database'"
    echo "5. Select 'Postgres'"
    echo "6. Copy the DATABASE_URL"
    echo ""
    echo -e "${GREEN}Then run:${NC}"
    echo "  vercel env add DATABASE_URL production"
    echo "  (paste your DATABASE_URL)"
    echo ""
    echo "  npx prisma migrate deploy"
    echo "  vercel --prod"
    ;;
    
  2)
    echo -e "${BLUE}☁️  Setting up AWS RDS PostgreSQL${NC}"
    echo ""
    echo -e "${YELLOW}Run these commands:${NC}"
    echo ""
    echo "# Create RDS instance"
    echo "aws rds create-db-instance \\"
    echo "  --db-instance-identifier kriya-db \\"
    echo "  --db-instance-class db.t3.micro \\"
    echo "  --engine postgres \\"
    echo "  --master-username postgres \\"
    echo "  --master-user-password YOUR_PASSWORD \\"
    echo "  --allocated-storage 20 \\"
    echo "  --publicly-accessible \\"
    echo "  --region ap-south-1"
    echo ""
    echo "# Get endpoint (wait 5-10 minutes)"
    echo "aws rds describe-db-instances \\"
    echo "  --db-instance-identifier kriya-db \\"
    echo "  --query 'DBInstances[0].Endpoint.Address' \\"
    echo "  --output text"
    ;;
    
  3)
    echo -e "${BLUE}🚀 Setting up Supabase${NC}"
    echo ""
    echo -e "${YELLOW}Steps:${NC}"
    echo "1. Go to https://supabase.com"
    echo "2. Create new project"
    echo "3. Copy connection string from Settings > Database"
    echo "4. Add to Vercel: vercel env add DATABASE_URL production"
    echo "5. Run: npx prisma migrate deploy"
    ;;
    
  4)
    echo -e "${BLUE}⚡ Setting up Neon${NC}"
    echo ""
    echo -e "${YELLOW}Steps:${NC}"
    echo "1. Go to https://neon.tech"
    echo "2. Create new project"
    echo "3. Copy connection string"
    echo "4. Add to Vercel: vercel env add DATABASE_URL production"
    echo "5. Run: npx prisma migrate deploy"
    ;;
esac

echo ""
echo -e "${GREEN}After setting up database:${NC}"
echo "1. Update DATABASE_URL in Vercel environment variables"
echo "2. Run: npx prisma migrate deploy"
echo "3. Deploy: vercel --prod"
echo ""
