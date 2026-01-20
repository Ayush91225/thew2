#!/bin/bash
echo "🔗 Linking to existing Vercel project with domain..."
echo ""
echo "When prompted:"
echo "1. Choose: Link to existing project? → YES"
echo "2. Search for the project that has 'kriya.navchetna.tech'"
echo "3. Select that project"
echo ""
read -p "Press Enter to continue..."
vercel link
echo ""
echo "Now deploying to production..."
vercel --prod
