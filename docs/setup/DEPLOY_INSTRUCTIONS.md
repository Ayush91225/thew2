# Deploy with MongoDB to kriya.navchetna.tech

## MongoDB URI Added ✅
The MongoDB connection string has been added to `vercel.json`

## Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Find your project (likely named `kriya-ide` or `thew2`)
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `MONGODB_URI`
   - **Value**: `mongodb+srv://tanmaysoni2105_db_user:6ud5EFkelHbBCaVF@cluster0.rcmtjdh.mongodb.net/kriya_ide?retryWrites=true&w=majority&appName=Cluster0`
   - **Environment**: Production
5. Go to **Deployments** tab
6. Click the **...** menu on the latest deployment
7. Click **Redeploy**

## Option 2: Deploy via CLI

```bash
cd /Users/tanmay/Desktop/KRIYA

# Link to existing project (if needed)
vercel link --yes

# Deploy to production
vercel --prod --yes
```

## Option 3: Git Push (If connected to GitHub)

```bash
git add .
git commit -m "Add MongoDB Atlas connection"
git push origin main
```

Vercel will auto-deploy on push.

## Verify Deployment

After deployment, test the MongoDB connection:

```bash
curl https://kriya.navchetna.tech/api/teams
curl https://kriya.navchetna.tech/api/users
```

You should see data from MongoDB Atlas.

## Seed MongoDB Atlas

Run this locally to seed your Atlas database:

```bash
# Update database/seed-mongo.js with Atlas URI
MONGODB_URI="mongodb+srv://tanmaysoni2105_db_user:6ud5EFkelHbBCaVF@cluster0.rcmtjdh.mongodb.net/kriya_ide?retryWrites=true&w=majority&appName=Cluster0" node database/seed-mongo.js
```
