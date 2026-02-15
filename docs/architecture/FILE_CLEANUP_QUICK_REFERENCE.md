# Quick Reference: Files to Keep vs Remove

## 📊 Quick Stats

- **Total Files**: ~54,712 (including node_modules)
- **Real Code Files**: ~169 files
- **Can Remove**: ~30 files
- **Should Ignore**: ~54,000+ files (node_modules, build artifacts)

---

## ✅ KEEP - Real Code Files (~169 files)

### Source Code
- ✅ All `.ts` files (60 files) - TypeScript source
- ✅ All `.tsx` files (53 files) - React components
- ✅ All `.js` files in `backend/`, `app/`, `lib/` (17 files)
- ✅ Configuration files: `package.json`, `tsconfig.json`, `next.config.js`, etc.

### Directories to Keep
- ✅ `app/` - Next.js application
- ✅ `components/` - React components
- ✅ `lib/` - Utility libraries
- ✅ `stores/` - State management
- ✅ `hooks/` - Custom hooks
- ✅ `backend/` - Backend code
- ✅ `public/` - Static assets
- ✅ `data/` - Data files
- ✅ `workspace/` - User workspace
- ✅ `types/` - Type definitions
- ✅ `test/` - Test files

### Documentation to Keep
- ✅ `README.md`
- ✅ `LOCAL_SETUP.md`
- ✅ `PRODUCTION_CONFIG.md`
- ✅ `COLLABORATION_COMPLETE.md`
- ✅ `REALTIME_SYNC_GUIDE.md`
- ✅ `ADMIN_DASHBOARD_INTEGRATION.md`
- ✅ `APP_ANALYSIS.md` (new)
- ✅ `BACKEND_ARCHITECTURE_ANALYSIS.md` (new)
- ✅ `BACKEND_CLEANUP_SUMMARY.md` (new)
- ✅ `FILE_ANALYSIS.md` (new)

---

## 🗑️ REMOVE - Unnecessary Files (~30 files)

### Test/Demo HTML Files (8 files)
```bash
rm test-collaboration.html
rm test-collaboration-realtime.html
rm test-preview.html
rm realtime-sync-test.html
rm debug-sync.html
rm minimal-test.html
rm index.html
rm kriya-original.html
rm architecture-diagram.html
```

### Backup/Duplicate Files (3 files)
```bash
rm components/SettingsView.tsx.backup
rm "stores/slices/settings-slice 3.ts"
rm websocket-server.js  # Already removed
```

### Log Files (2 files)
```bash
rm backend/server.log
rm websocket.log
```

### Duplicate Directories (2-3 dirs)
```bash
rm -rf "app 2"  # If exists
rm -rf thew2
rm -rf server  # If yjs-server.js not used
```

### Redundant Deployment Scripts (5 files)
```bash
rm deploy-fix.sh
rm deploy-quick.sh
rm deploy-realtime.sh
rm deploy-to-domain.sh
rm deploy-amplify.sh  # If not using Amplify
```

### Completed Fix Documentation (8 files - Archive)
```bash
mkdir -p docs/archive
mv BACKEND_FIX_README.md docs/archive/
mv FILE_SYSTEM_FIX.md docs/archive/
mv FIXES_APPLIED.md docs/archive/
mv FRONTEND_URL_UPDATED.md docs/archive/
mv VERCEL_DEPLOYMENT_FIX.md docs/archive/
mv REALTIME_COLLABORATION_FIXES.md docs/archive/
mv DEPLOY_NOW.md docs/archive/
mv fix-issues.md docs/archive/
```

---

## 🚫 IGNORE - Build Artifacts (Add to .gitignore)

### Already in .gitignore
- ✅ `node_modules/` (524 MB)
- ✅ `.next/` (Next.js build)
- ✅ `.serverless/` (Serverless build)
- ✅ `*.log` (Log files)
- ✅ `.env*` (Environment files)

### Should Add to .gitignore
```
# TypeScript build info
tsconfig.tsbuildinfo

# CDK build output
cdk.out/

# Test files
test-*.html
debug-*.html
minimal-test.html

# Backup files
*.backup
* 3.*
```

---

## 📁 Directory Structure After Cleanup

```
KRIYA/
├── app/                    ✅ KEEP - Next.js app
├── components/              ✅ KEEP - React components
├── lib/                     ✅ KEEP - Utilities
├── stores/                  ✅ KEEP - State management
├── hooks/                   ✅ KEEP - Custom hooks
├── backend/                 ✅ KEEP - Backend code
│   ├── local-server.js      ✅ KEEP
│   ├── main/                ✅ KEEP
│   └── aws-websocket/       ✅ KEEP
├── public/                  ✅ KEEP - Assets
├── data/                    ✅ KEEP - Data files
├── workspace/               ✅ KEEP - User workspace
├── types/                   ✅ KEEP - Type definitions
├── test/                    ✅ KEEP - Tests
├── node_modules/            🚫 IGNORE - Dependencies
├── .next/                   🚫 IGNORE - Build output
└── docs/                    ✅ KEEP - Documentation
    └── archive/              ✅ KEEP - Archived docs
```

---

## 🎯 Cleanup Commands (One-liner)

### Remove Test Files
```bash
rm -f test-*.html debug-*.html minimal-test.html index.html kriya-original.html architecture-diagram.html
```

### Remove Backup Files
```bash
rm -f components/SettingsView.tsx.backup "stores/slices/settings-slice 3.ts"
```

### Remove Log Files
```bash
rm -f backend/server.log websocket.log
```

### Remove Duplicate Directories
```bash
rm -rf "app 2" thew2 server
```

### Remove Redundant Scripts
```bash
rm -f deploy-fix.sh deploy-quick.sh deploy-realtime.sh deploy-to-domain.sh deploy-amplify.sh
```

### Archive Fix Documentation
```bash
mkdir -p docs/archive && mv *_FIX*.md FIXES_APPLIED.md fix-issues.md DEPLOY_NOW.md docs/archive/ 2>/dev/null
```

---

## ✅ Verification

After cleanup, you should have:
- ✅ ~169 real code files
- ✅ ~15 active documentation files
- ✅ No test HTML files
- ✅ No backup files
- ✅ No duplicate directories
- ✅ Clean .gitignore

---

**Quick Reference Date**: 2024

