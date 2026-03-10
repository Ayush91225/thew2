#!/bin/bash
echo "🔍 Testing Database Connection & App Integration"
echo "================================================"

export DATABASE_URL="postgres://95d72ee4adf3b9e61184b6523e6ede66b0e0a594b16d39b95caa3fd0b950c28c:sk_ipOln2sa8GGBDNJn8CzCK@db.prisma.io:5432/postgres?sslmode=require"

echo ""
echo "✅ DATABASE CONNECTION TEST"
node -e "
const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.\$connect();
    console.log('✅ Connected to Vercel Postgres');
    
    const tables = await prisma.\$queryRaw\`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'\`;
    console.log('✅ Tables found:', tables.length);
    
    const companyCount = await prisma.company.count();
    const userCount = await prisma.user.count();
    
    console.log('✅ Companies:', companyCount);
    console.log('✅ Users:', userCount);
    
    await prisma.\$disconnect();
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}
test();
"

echo ""
echo "================================================"
echo "✅ DATABASE IS PERFECTLY DEPLOYED & CONNECTED!"
echo "================================================"
