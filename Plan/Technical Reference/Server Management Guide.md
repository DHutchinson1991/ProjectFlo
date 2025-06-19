# ProjectFlo Server Management Guide

## ⚡ QUICK REFERENCE - PORT STANDARDIZATION

### 🎯 **FINAL PORT CONFIGURATION** (Updated June 19, 2025)
| Service | Port | URL | Status |
|---------|------|-----|--------|
| **Backend API** | `3002` | `http://localhost:3002` | ✅ **STANDARDIZED** |
| **Frontend Web** | `3001` | `http://localhost:3001` | ✅ **STANDARDIZED** |
| **Database** | `5432` | `localhost:5432` | ✅ **STANDARDIZED** |

### 🚨 **IMPORTANT NOTES:**
- **NO MORE PORT CONFUSION** - These ports are now fixed across all files
- **Backend ALWAYS = 3002**
- **Frontend ALWAYS = 3001**
- All test scripts and configuration files have been updated

---

## 🚀 Server Configuration (STANDARDIZED)

### Port Configuration ✅ CORRECTED
- **Backend API Server**: `http://localhost:3002` ✅
- **Frontend Next.js**: `http://localhost:3001` ✅ 
- **Database**: PostgreSQL (typically port 5432)

### Environment Setup
The ProjectFlo application runs as a **monorepo with pnpm workspaces**:

```
packages/
├── backend/     # NestJS API server (port 3002)
└── frontend/    # Next.js web app (port 3001)
```

## 📋 Server Start/Stop Procedures

### Starting All Servers (Recommended)

**From project root directory:**
```bash
cd "c:\Users\info\Documents\Website Files\ProjectFlo"
pnpm run dev
```
This starts both backend (3002) and frontend (3001) concurrently.

### Starting Individual Servers

#### Backend Only (NestJS API)
```bash
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"
npm run start:dev
# OR
pnpm run start:dev
```
- **Port**: 3002
- **API Base URL**: `http://localhost:3002`
- **Status**: Check `http://localhost:3002/health` (if available)

#### Frontend Only (Next.js)
```bash
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\frontend"
npm run dev
# OR
pnpm run dev
```
- **Port**: 3001
- **Web URL**: `http://localhost:3001`

### Stopping Servers

#### Graceful Stop
- **Windows**: `Ctrl + C` in the terminal
- **All Servers**: If using `pnpm run dev`, Ctrl+C stops both

#### Force Stop (if needed)
```bash
# Kill processes using specific ports
netstat -ano | findstr :3002
taskkill /PID <process_id> /F

netstat -ano | findstr :3001
taskkill /PID <process_id> /F
```

## 🔧 Server Configuration Files

### Backend Configuration (`packages/backend/src/main.ts`)
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3002); // ← Backend port
}
```

### Frontend Configuration (`packages/frontend/package.json`)
```json
{
  "scripts": {
    "dev": "next dev -p 3001",  // ← Frontend port
    "build": "next build",
    "start": "next start"
  }
}
```

### Root Configuration (`package.json`)
```json
{
  "scripts": {
    "dev": "concurrently \"pnpm --filter backend run start:dev\" \"pnpm --filter frontend run dev\"",
    "build": "pnpm --filter backend run build && pnpm --filter frontend run build"
  }
}
```

## 🧪 Testing Server Status

### Manual Testing
```bash
# Test backend API
curl http://localhost:3002/components
# OR
node test-api.js

# Test frontend
curl http://localhost:3001
# OR open browser to http://localhost:3001
```

### Automated Testing Scripts
- **`test-api.js`**: Tests backend endpoints (port 3002)
- **`test-phase1b-apis.js`**: Phase 1B specific tests

## ⚠️ Common Issues & Solutions

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :3002
# Kill the process
taskkill /PID <process_id> /F
```

### Server Won't Start
1. **Check Dependencies**: `pnpm install`
2. **Check Database**: Ensure PostgreSQL is running
3. **Check Environment**: Verify `.env` files
4. **Check Compilation**: Look for TypeScript errors

### Wrong Port in Tests
- **Backend tests**: Must use `http://localhost:3002`
- **Frontend tests**: Must use `http://localhost:3001`
- **API calls from frontend to backend**: Use `http://localhost:3002/api/*`

## 📊 Server Health Monitoring

### Backend Health Checks
```bash
# Basic connectivity
curl http://localhost:3002/components

# Database connectivity
curl http://localhost:3002/timeline/layers

# Analytics functionality
curl http://localhost:3002/analytics/components/overview
```

### Performance Monitoring
- **Backend startup**: ~2-3 seconds
- **Frontend startup**: ~5-10 seconds
- **API response times**: < 100ms typical
- **Database queries**: Monitor in development console

## 🔄 Development Workflow

### Typical Development Session
1. **Start**: `pnpm run dev` (from project root)
2. **Verify**: Check both `localhost:3001` and `localhost:3002`
3. **Develop**: Make changes, servers auto-reload
4. **Test**: Run `node test-api.js` for backend
5. **Stop**: `Ctrl + C` when done

### Hot Reload Configuration
- **Backend**: NestJS watch mode enabled
- **Frontend**: Next.js hot reload enabled
- **Changes**: Auto-detected and reloaded

---

## 🚨 Critical Notes & Port Standardization

### **PORT CONFUSION PREVENTION**
❌ **NEVER USE THESE PORTS:**
- Backend on port 3000 (WRONG)
- Frontend on port 3000 (WRONG)
- Any configuration mixing up 3000/3001/3002

✅ **ALWAYS USE THESE PORTS:**
- **Backend API**: `3002` ONLY
- **Frontend Web**: `3001` ONLY
- **Database**: `5432` (standard PostgreSQL)

### **Critical Development Notes**
1. **Always use port 3002 for backend API testing**
2. **Backend must be running before frontend API calls work**
3. **Database must be running before backend starts**
4. **Use pnpm (not npm) for workspace management**
5. **Start from project root with `pnpm run dev` for full stack**

### **Files Updated for Port Standardization (June 19, 2025)**
- ✅ `packages/backend/src/main.ts` - Backend port 3002
- ✅ `packages/frontend/package.json` - Frontend port 3001  
- ✅ `packages/backend/test-api.js` - Testing port 3002
- ✅ `packages/backend/test-phase1b-apis.js` - Testing port 3002
- ✅ `packages/frontend/.env.local` - API URL port 3002
- ✅ All documentation files updated

### **Quick Port Check Commands**
```bash
# Check if backend is running on correct port
curl http://localhost:3002/components

# Check if frontend is running on correct port  
curl http://localhost:3001

# Check what's running on each port
netstat -ano | findstr :3001
netstat -ano | findstr :3002
```

---

**Last Updated**: June 19, 2025  
**Current Status**: Phase 1B Backend Complete ✅
