#!/bin/bash

# Simple Directory Detector for ProjectFlo
# Just tells me where I am and what commands are appropriate

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current location
current_dir=$(pwd)

echo "📍 CURRENT LOCATION"
echo "==================="
echo "Directory: $current_dir"
echo ""

# Detect terminal type based on directory
if [[ "$current_dir" =~ backend$ ]]; then
    echo -e "${GREEN}✅ BACKEND Terminal${NC}"
    echo "Available commands:"
    echo "  • npm run start:dev"
    echo "  • npx prisma studio"
    echo "  • npx prisma migrate dev"
    echo "  • curl -s http://localhost:3002/components | jq length"
    echo "  • node test-api-endpoints.js"
    
elif [[ "$current_dir" =~ frontend$ ]]; then
    echo -e "${GREEN}✅ FRONTEND Terminal${NC}"
    echo "Available commands:"
    echo "  • npm run dev"
    echo "  • npm run build"
    echo "  • npm run lint"
    
elif [[ "$current_dir" =~ ProjectFlo$ ]]; then
    echo -e "${GREEN}✅ ROOT Terminal (Servers/General)${NC}"
    echo "Available commands:"
    echo "  • pnpm dev (start both servers)"
    echo "  • pnpm build"
    echo "  • git status"
    echo "  • ./jq.exe --version"
    
else
    echo -e "${YELLOW}⚠️  UNKNOWN Location${NC}"
    echo "Expected locations:"
    echo "  • ROOT: .../ProjectFlo"
    echo "  • BACKEND: .../ProjectFlo/packages/backend"
    echo "  • FRONTEND: .../ProjectFlo/packages/frontend"
    echo ""
    echo "Quick navigation:"
    echo "  cd \"c:\\Users\\info\\Documents\\Website Files\\ProjectFlo\""
    echo "  cd \"c:\\Users\\info\\Documents\\Website Files\\ProjectFlo\\packages\\backend\""
    echo "  cd \"c:\\Users\\info\\Documents\\Website Files\\ProjectFlo\\packages\\frontend\""
fi

echo ""
echo "🔍 Server Status:"
# Quick server check
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Frontend (3001): Running${NC}"
else
    echo -e "  ${RED}❌ Frontend (3001): Not running${NC}"
fi

if curl -s http://localhost:3002/components > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Backend (3002): Running${NC}"
else
    echo -e "  ${RED}❌ Backend (3002): Not running${NC}"
fi

echo ""
