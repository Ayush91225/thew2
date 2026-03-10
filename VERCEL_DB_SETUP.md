# Vercel Database Deployment Guide

## ✅ Database URLs Configured

Your Vercel Postgres database is ready with the following connection string:

```
postgres://95d72ee4adf3b9e61184b6523e6ede66b0e0a594b16d39b95caa3fd0b950c28c:sk_ipOln2sa8GGBDNJn8CzCK@db.prisma.io:5432/postgres?sslmode=require
```

## 📋 Deployment Steps

### 1. Set Environment Variables in Vercel

Go to your Vercel project settings and add:

```bash
DATABASE_URL="postgres://95d72ee4adf3b9e61184b6523e6ede66b0e0a594b16d39b95caa3fd0b950c28c:sk_ipOln2sa8GGBDNJn8CzCK@db.prisma.io:5432/postgres?sslmode=require"
```

**Important:** Add this to **Production**, **Preview**, and **Development** environments.

### 2. Run Prisma Migrations

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.production

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

#### Option B: Direct Migration
```bash
# Set the production database URL temporarily
export DATABASE_URL="postgres://95d72ee4adf3b9e61184b6523e6ede66b0e0a594b16d39b95caa3fd0b950c28c:sk_ipOln2sa8GGBDNJn8CzCK@db.prisma.io:5432/postgres?sslmode=require"

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Or create a new migration
npx prisma migrate dev --name init
```

### 3. Seed the Database (Optional)

```bash
# Using the production URL
export DATABASE_URL="postgres://95d72ee4adf3b9e61184b6523e6ede66b0e0a594b16d39b95caa3fd0b950c28c:sk_ipOln2sa8GGBDNJn8CzCK@db.prisma.io:5432/postgres?sslmode=require"

# Run seed script
node database/seed.sql
# or
psql $DATABASE_URL -f database/schema.sql
```

### 4. Deploy to Vercel

```bash
# Deploy
vercel --prod

# Or push to main branch (if auto-deploy is enabled)
git add .
git commit -m "Configure Vercel Postgres"
git push origin main
```

## 🔍 Verify Database Connection

### Check Prisma Studio
```bash
export DATABASE_URL="postgres://95d72ee4adf3b9e61184b6523e6ede66b0e0a594b16d39b95caa3fd0b950c28c:sk_ipOln2sa8GGBDNJn8CzCK@db.prisma.io:5432/postgres?sslmode=require"
npx prisma studio
```

### Test Connection
```bash
# Create a test script
node -e "
const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Connected to Vercel Postgres'))
  .catch(err => console.error('❌ Connection failed:', err))
  .finally(() => prisma.\$disconnect());
"
```

## 📁 Current Configuration

### Local Development (.env.local)
```
DATABASE_URL=postgresql://postgres:vratika@localhost:5432/thew2_db
```

### Production (.env.production)
```
DATABASE_URL="postgres://95d72ee4adf3b9e61184b6523e6ede66b0e0a594b16d39b95caa3fd0b950c28c:sk_ipOln2sa8GGBDNJn8CzCK@db.prisma.io:5432/postgres?sslmode=require"
```

## 🚀 Quick Deploy Script

Create a script to automate deployment:

```bash
#!/bin/bash
# scripts/deploy-with-db.sh

echo "🔄 Deploying to Vercel with Database..."

# Set production database URL
export DATABASE_URL="postgres://95d72ee4adf3b9e61184b6523e6ede66b0e0a594b16d39b95caa3fd0b950c28c:sk_ipOln2sa8GGBDNJn8CzCK@db.prisma.io:5432/postgres?sslmode=require"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x scripts/deploy-with-db.sh
./scripts/deploy-with-db.sh
```

## 🛠️ Troubleshooting

### Error: "Can't reach database server"
- Check if the database URL is correct
- Verify SSL mode is set to `require`
- Ensure your IP is not blocked (Vercel Postgres allows all IPs by default)

### Error: "Prisma Client not generated"
```bash
npx prisma generate
```

### Error: "Migration failed"
```bash
# Reset and re-run migrations
npx prisma migrate reset
npx prisma migrate deploy
```

### Check Database Tables
```bash
export DATABASE_URL="postgres://95d72ee4adf3b9e61184b6523e6ede66b0e0a594b16d39b95caa3fd0b950c28c:sk_ipOln2sa8GGBDNJn8CzCK@db.prisma.io:5432/postgres?sslmode=require"

# List tables
psql $DATABASE_URL -c "\dt"

# Check specific table
psql $DATABASE_URL -c "SELECT * FROM \"User\" LIMIT 5;"
```

## 📊 Database Schema

Your Prisma schema includes:
- ✅ Company
- ✅ User (with roles: OWNER, EMPLOYEE)
- ✅ Project
- ✅ Team
- ✅ TeamMember
- ✅ Invitation

## 🔐 Security Notes

1. **Never commit** `.env.production` to Git (already in `.gitignore`)
2. **Rotate credentials** if exposed
3. **Use environment variables** in Vercel dashboard
4. **Enable SSL** (already configured with `sslmode=require`)

## 📝 Next Steps

1. ✅ Environment variables configured
2. ⏳ Run Prisma migrations
3. ⏳ Seed initial data (optional)
4. ⏳ Deploy to Vercel
5. ⏳ Test authentication flow
6. ⏳ Verify database operations

## 🔗 Useful Links

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma Docs](https://www.prisma.io/docs)
- [Your Vercel Dashboard](https://vercel.com/dashboard)
