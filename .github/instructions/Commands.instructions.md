---
applyTo: "**"
---

# **ProjectFlo - Complete Command Reference**

## **🚨 NAVIGATION SAFETY FIRST**

### **Always Check Your Location:**

```bash
# BEFORE running any command, check where you are:
pwd

# You should be in ONE of these locations:
# ✅ ROOT: /c/Users/info/Documents/Website Files/ProjectFlo
# ✅ BACKEND: /c/Users/info/Documents/Website Files/ProjectFlo/packages/backend
# ✅ FRONTEND: /c/Users/info/Documents/Website Files/ProjectFlo/packages/frontend

# ❌ AVOID being in: /c/Users/info/Documents/Website Files/ProjectFlo/packages
# This is the packages folder itself - NOT where you want to be!
```

### **Quick Recovery Commands:**

```bash
# Lost? Get back to root directory:
cd "c:\Users\info\Documents\Website Files\ProjectFlo"

# Or use the home shortcut:
cd ~/Documents/Website\ Files/ProjectFlo

# From anywhere, check if you're in the right place:
ls -la | grep -E "(pnpm-workspace|package.json|packages/)"
# Should show: pnpm-workspace.yaml and packages/ directory if you're in root
```

### **Safe Navigation Patterns:**

```bash
# Pattern 1: Always start from root
cd "c:\Users\info\Documents\Website Files\ProjectFlo"  # Go to root first
cd packages/backend                                     # Then navigate to backend

# Pattern 2: Use full paths (safest)
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"

# Pattern 3: Check before moving
pwd && cd packages/backend && pwd  # Show before and after
```

## **🏠 ROOT DIRECTORY COMMANDS**

**Location:** `c:\Users\info\Documents\Website Files\ProjectFlo\`

### **Main Development Commands:**

- `pnpm dev` - **Start both frontend and backend servers concurrently**
- `pnpm build` - Build all packages
- `pnpm test` - Run tests in all packages
- `pnpm format` - Format all code with Prettier
- `pnpm lint` - Lint all packages
- `pnpm lint:fix` - Lint and auto-fix all packages

---

## **🔧 BACKEND COMMANDS**

**Location:** `c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend\`

### **Server Commands:**

- `npm run start:dev` - Start backend in development mode with watch
- `npm run start` - Start backend in production mode
- `npm run start:debug` - Start with debugging
- `npm run start:prod` - Start production build

### **Build & Test:**

- `npm run build` - Generate Prisma client and build NestJS
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:debug` - Run tests in debug mode
- `npm run test:e2e` - Run all end-to-end tests

#### **Running Individual E2E Tests:**

- `npm run test:e2e:contacts-api` - Run only Contacts API e2e tests
- `npm run test:e2e:contributors-api` - Run only Contributors API e2e tests
- `npm run test:e2e:roles-api` - Run only Roles API e2e tests
- `npm run test:e2e:components-api` - Run only Components API e2e tests

#### **Running Tests & Waiting for Completion:**

```bash
# Run a test and wait for completion before proceeding
# The echo statements help you identify when tests start and finish
echo "Starting Contacts API tests..."
npm run test:e2e:contacts-api
echo "Contacts API tests completed!"

# For running multiple tests in sequence and waiting for each to complete
echo "Starting test sequence..."
npm run test:e2e:contacts-api && echo "Contacts tests done!" && \
npm run test:e2e:contributors-api && echo "Contributors tests done!" && \
npm run test:e2e:roles-api && echo "Roles tests done!"
echo "All tests completed!"

# To capture test output to a file while still displaying in terminal
npm run test:e2e:contacts-api | tee test-results.log
echo "Tests completed and results saved to test-results.log"
```

### **Database & Prisma:**

- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma client
- `npx prisma db seed` - Seed database
- `npx prisma studio` - Open Prisma Studio (database browser)
- `npx prisma db push` - Push schema to database

### **Database Setup & Testing Workflow:**

```bash
# Common workflow for database setup and testing
echo "Setting up database..."
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
echo "Database setup complete!"

# Run tests immediately after database setup
echo "Running e2e tests..."
npm run test:e2e
echo "E2E tests completed!"

# OR run a specific API test after database setup
echo "Running specific API test..."
npm run test:e2e:contacts-api
echo "API test completed!"
```

### **Custom Scripts (run with `node`):**

- `node test-api-endpoints.js` - Test API endpoints
- `node test-phase2a-backend.js` - Test Phase 2A backend functionality
- `node test-workflow-api.js` - Test workflow APIs
- `node test-task-management.js` - Test task management
- `node verify-database.js` - Verify database structure
- `node verify-seeding.ts` - Verify database seeding (TypeScript)
- `node seed-workflow-data.js` - Seed workflow data
- `node seed-task-templates.js` - Seed task templates
- `node migrate-task-recipes.js` - Migrate task recipes
- `node create-workflow-tables.js` - Create workflow tables
- `node reset-feature-film.js` - Reset feature film data

---

## **🎨 FRONTEND COMMANDS**

**Location:** `c:\Users\info\Documents\Website Files\ProjectFlo\packages\frontend\`

### **Development:**

- `npm run dev` - Start Next.js development server (port 3001)
- `npm run build` - Build Next.js application
- `npm run start` - Start Next.js production server
- `npm run lint` - Run Next.js linting

---

## **📦 PNPM WORKSPACE COMMANDS**

**From Root Directory:**

### **Package-Specific Commands:**

- `pnpm --filter backend run start:dev` - Start only backend
- `pnpm --filter frontend run dev` - Start only frontend
- `pnpm --filter backend run build` - Build only backend
- `pnpm --filter frontend run build` - Build only frontend

### **Dependencies:**

- `pnpm install` - Install all dependencies
- `pnpm add <package>` - Add dependency to root
- `pnpm --filter backend add <package>` - Add dependency to backend
- `pnpm --filter frontend add <package>` - Add dependency to frontend

---

## **🛠️ DEVELOPMENT TOOLS SETUP**

### **JSON Processing with jq:**

**Install jq for better JSON handling:**

#### **Windows (using Chocolatey):**

```bash
# Install Chocolatey first if you don't have it
# Run in Administrator PowerShell:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Then install jq
choco install jq
```

#### **Windows (Manual Download):**

```bash
# Download jq from: https://stedolan.github.io/jq/download/
# Place jq.exe in your PATH or in the project directory
```

#### **Git Bash (recommended for Windows):**

```bash
# jq is often pre-installed with Git for Windows
jq --version  # Check if already available

# If not available, download manually to ROOT directory:
cd "c:\Users\info\Documents\Website Files\ProjectFlo"
curl -L -o jq.exe https://github.com/stedolan/jq/releases/latest/download/jq-win64.exe

# On Windows Git Bash, you may need to make it executable:
chmod +x jq.exe  # chmod = "change mode" - makes file executable

# Copy to backend directory for convenience:
cp jq.exe packages/backend/

# Test it works from both locations:
./jq.exe --version                    # From root
cd packages/backend && ./jq.exe --version  # From backend

# Use local jq from any directory:
# From root: curl -s http://localhost:3002/components | ./jq.exe '.'
# From backend: curl -s http://localhost:3002/components | ./jq.exe '.'
```

#### **Windows Command Prompt/PowerShell Alternative:**

```cmd
# Download jq for Windows
curl -L -o jq.exe https://github.com/stedolan/jq/releases/latest/download/jq-win64.exe

# No chmod needed in Windows CMD/PowerShell - .exe files are automatically executable
jq.exe --version

# Use it:
curl -s http://localhost:3002/components | jq.exe "."
```

### **Enhanced API Testing with jq:**

```bash
# Note: jq.exe is available in both root and backend directories
# Use ./jq.exe from either location

# Pretty print JSON responses
curl -s http://localhost:3002/components | ./jq.exe '.'

# Get specific fields
curl -s http://localhost:3002/components | ./jq.exe '.[].name'

# Filter by type
curl -s http://localhost:3002/components | ./jq.exe '.[] | select(.type == "VIDEO")'

# Count components by type
curl -s http://localhost:3002/components | ./jq.exe 'group_by(.type) | map({type: .[0].type, count: length})'

# Get component with default tasks
curl -s "http://localhost:3002/api/entities/component/1/default-tasks" | ./jq.exe '.data'

# Test timeline layers
curl -s http://localhost:3002/timeline/layers | ./jq.exe '.[] | {name: .name, id: .id, order: .order_index}'

# Get components by complexity
curl -s http://localhost:3002/components | ./jq.exe '.[] | select(.complexity_score >= 5) | {name: .name, complexity: .complexity_score, type: .type}'

# Check component task hours
curl -s http://localhost:3002/components | ./jq.exe '.[] | {name: .name, hours: .base_task_hours, type: .type}' | head -10

# Verify backend is running
curl -s http://localhost:3002/components > /dev/null && echo "✅ Backend (3002): Running" || echo "❌ Backend (3002): Not running"

# Verify frontend is running
curl -s http://localhost:3001 > /dev/null && echo "✅ Frontend (3001): Running" || echo "❌ Frontend (3001): Not running"
```

### **Quick Health Checks:**

```bash
# ⚠️ STEP 1: Check your location first!
pwd
# If you're in /packages/, run: cd ..

# Note: These work from root or backend directory (both have jq.exe)

# Check if both servers are running
echo "=== Server Status Check ==="
curl -s http://localhost:3001 > /dev/null && echo "✅ Frontend (3001): Running" || echo "❌ Frontend (3001): Not running"
curl -s http://localhost:3002/components > /dev/null && echo "✅ Backend (3002): Running" || echo "❌ Backend (3002): Not running"

# Test database connection
curl -s http://localhost:3002/timeline/layers | ./jq.exe 'length' > /dev/null && echo "✅ Database: Connected" || echo "❌ Database: Connection failed"

# Quick component count
echo "=== Component Library Stats ==="
curl -s http://localhost:3002/components | ./jq.exe 'length' | xargs echo "Total components:"
curl -s http://localhost:3002/components | ./jq.exe 'group_by(.type) | map({type: .[0].type, count: length})'

# Backend-specific tests (navigate safely to backend directory)
echo "=== Navigating to Backend for Additional Tests ==="
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"
pwd  # Confirm location
echo "=== Backend-Specific Tests ==="
curl -s http://localhost:3002/components | ./jq.exe '.[] | select(.complexity_score >= 5) | .name' | wc -l | xargs echo "High complexity components:"
curl -s "http://localhost:3002/api/entities/component/1/default-tasks" | ./jq.exe '.data | length' | xargs echo "Default tasks for component 1:"

# Return to root when done
cd "c:\Users\info\Documents\Website Files\ProjectFlo"
pwd  # Confirm back in root
```

---

## **🚀 RECOMMENDED DEVELOPMENT WORKFLOW**

### **Start Full Development Environment:**

```bash
# From root directory
cd "c:\Users\info\Documents\Website Files\ProjectFlo"
pnpm dev
```

This starts both frontend (localhost:3001) and backend (localhost:3002) concurrently.

### **Start Individual Services:**

```bash
# Backend only
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"
npm run start:dev

# Frontend only
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\frontend"
npm run dev
```

### **Database Operations:**

```bash
# From backend directory
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"
npx prisma migrate dev    # Apply migrations
npx prisma generate       # Generate client
npx prisma db seed       # Seed database
npx prisma studio        # Open database browser
```

### **🚨 Important Prisma & Server Management Guidelines:**

#### **Always Use `npx prisma generate` (NOT `prisma generate`):**

```bash
# ✅ CORRECT - Always use npx:
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"
npx prisma generate

# ❌ WRONG - Don't use global prisma:
prisma generate   # This may use wrong version or fail

# Why npx? It ensures you use the project's specific Prisma version
# and runs from the correct directory context
```

#### **Kill Backend Server Before Running Scripts:**

```bash
# 🛑 ALWAYS kill the backend server before running database scripts:
# In the terminal running the backend (Ctrl+C to stop):
# Backend server at http://localhost:3002

# Or if you need to force kill:
# Windows Task Manager > Find Node.js processes > End task
# Or use command:
taskkill /F /IM node.exe

# After killing server, you can safely run:
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"
npx prisma generate                    # Regenerate client
node seed-first-dance-components.js    # Run scripts
node cleanup-first-dance-components.js # Clean up data
# ... other scripts

# Then restart the server:
npm run start:dev
```

#### **Schema Changes Workflow:**

```bash
# 1. Stop the backend server (Ctrl+C)
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"

# 2. Make schema changes in prisma/schema.prisma

# 3. Generate new migration and client:
npx prisma migrate dev --name "describe-your-changes"
npx prisma generate

# 4. Run any data migration scripts:
node your-migration-script.js

# 5. Restart the server:
npm run start:dev
```

---

## **⚡ QUICK DEVELOPMENT COMMANDS**

### **Server Management:**

```bash
# Kill processes on ports (if servers are stuck)
npx kill-port 3001  # Frontend port
npx kill-port 3002  # Backend port

# Start servers individually (useful for debugging)
cd packages/backend && npm run start:dev    # Backend only
cd packages/frontend && npm run dev         # Frontend only

# Check what's running on ports
netstat -ano | findstr :3001
netstat -ano | findstr :3002
```

### **Database Quick Commands:**

```bash
# From backend directory
cd packages/backend

# Reset and reseed database
npx prisma db push --force-reset && npx prisma db seed

# Quick database backup
npx prisma db pull

# Open database browser
npx prisma studio &  # Runs in background
```

### **API Testing Shortcuts:**

```bash
# ⚠️ IMPORTANT: Check your location first!
pwd

# Note: Use ./jq.exe from root or backend directory
# If you're in /packages/ directory, go back: cd ..

# Test main endpoints quickly (works from root or backend directory)
curl -s http://localhost:3002/components | ./jq.exe 'length'
curl -s http://localhost:3002/timeline/layers | ./jq.exe 'length'
curl -s "http://localhost:3002/api/entities/component/1/default-tasks" | ./jq.exe '.success'

# Component library search
curl -s http://localhost:3002/components | ./jq.exe '.[] | select(.name | contains("Dance"))'
curl -s http://localhost:3002/components | ./jq.exe '.[] | select(.type == "GRAPHICS") | .name'

# Timeline layer verification
curl -s http://localhost:3002/timeline/layers | ./jq.exe 'sort_by(.order_index) | .[] | "\(.order_index): \(.name) (ID: \(.id))"'

# Backend-specific testing (navigate to backend directory first)
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"  # Full path to be safe
pwd  # Verify you're in the right place
curl -s http://localhost:3002/components | ./jq.exe 'group_by(.type) | map({type: .[0].type, count: length})'
curl -s http://localhost:3002/components | ./jq.exe '.[] | {name: .name, hours: .base_task_hours, type: .type}' | head -10
```

### **Troubleshooting Commands:**

```bash
# Directory Issues:
pwd  # First, see where you are

# If you're lost, get back to root:
cd "c:\Users\info\Documents\Website Files\ProjectFlo"

# If jq.exe is not found:
ls -la | grep jq.exe  # Check if jq.exe exists in current directory
# If not found, you're probably in the wrong directory

# Other issues:
# Clear node modules and reinstall
rm -rf node_modules packages/*/node_modules
pnpm install

# Check for TypeScript errors
cd packages/frontend && npm run build
cd packages/backend && npm run build

# View recent logs
cd packages/backend && npm run start:dev 2>&1 | head -20
```

---

## **🔍 QUICK REFERENCE**

| Task                 | Command                                                                  | Location     | Port      |
| -------------------- | ------------------------------------------------------------------------ | ------------ | --------- |
| **Start Everything** | `pnpm dev`                                                               | Root         | 3001/3002 |
| **Backend Only**     | `npm run start:dev`                                                      | Backend      | 3002      |
| **Frontend Only**    | `npm run dev`                                                            | Frontend     | 3001      |
| **Database Browser** | `npx prisma studio`                                                      | Backend      | 5555      |
| **Run Tests**        | `npm test`                                                               | Backend      | -         |
| **Lint All**         | `pnpm lint:fix`                                                          | Root         | -         |
| **Build All**        | `pnpm build`                                                             | Root         | -         |
| **Kill Ports**       | `npx kill-port 3001 3002`                                                | Any          | -         |
| **Reset DB**         | `npx prisma db push --force-reset && npx prisma db seed`                 | Backend      | -         |
| **jq JSON**          | `curl -s http://localhost:3002/components \| ./jq.exe '.'`               | Root/Backend | 3002      |
| **Directory Check**  | `pwd`                                                                    | Any          | -         |
| **Go to Root**       | `cd "c:\Users\info\Documents\Website Files\ProjectFlo"`                  | Any          | -         |
| **Go to Backend**    | `cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"` | Any          | -         |

## **🚨 DIRECTORY SAFETY**

Always check your location before running commands:

| Current Directory                                                    | Status          | What to Do                                                   |
| -------------------------------------------------------------------- | --------------- | ------------------------------------------------------------ |
| `/c/Users/info/Documents/Website Files/ProjectFlo`                   | ✅ **ROOT**     | Good! Run: `pnpm dev`, `./jq.exe` commands                   |
| `/c/Users/info/Documents/Website Files/ProjectFlo/packages/backend`  | ✅ **BACKEND**  | Good! Run: `npm run start:dev`, `./jq.exe` commands          |
| `/c/Users/info/Documents/Website Files/ProjectFlo/packages`          | ❌ **LOST**     | Run: `cd ..` to go back to root                              |
| `/c/Users/info/Documents/Website Files/ProjectFlo/packages/frontend` | ⚠️ **FRONTEND** | For frontend tasks only                                      |
| Anywhere else                                                        | ❌ **LOST**     | Run: `cd "c:\Users\info\Documents\Website Files\ProjectFlo"` |

### **Directory-Aware Commands:**

```bash
# ⚠️ IMPORTANT: Always check where you are first to avoid getting lost in packages/
pwd

# 🏠 Navigate to ROOT directory (where pnpm-workspace.yaml lives):
cd "c:\Users\info\Documents\Website Files\ProjectFlo"           # Root directory
# OR use this shortcut from anywhere:
cd ~/Documents/Website\ Files/ProjectFlo

# 🔧 Navigate to BACKEND directory for backend-specific tasks:
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"  # Backend directory
# OR from root:
cd packages/backend

# ⚠️ AVOID: Don't get stuck in the packages/ directory itself:
# If pwd shows: /c/Users/info/Documents/Website Files/ProjectFlo/packages
# Run: cd .. to go back to root

# ✅ Quick navigation aliases:
alias cdroot='cd "c:\Users\info\Documents\Website Files\ProjectFlo"'
alias cdback='cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"'
alias cdfrom='cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\frontend"'

# jq.exe is available in both Root and Backend directories
# Use ./jq.exe from either location
```

### **Essential URLs:**

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3002
- **Components API:** http://localhost:3002/components
- **Timeline Layers:** http://localhost:3002/timeline/layers
- **Default Tasks:** http://localhost:3002/api/entities/component/{id}/default-tasks
- **Database Browser:** http://localhost:5555 (when Prisma Studio is running)

### **API Response Examples:**

```bash
# Components endpoint structure
curl -s http://localhost:3002/components | ./jq.exe '.[0]'
# Returns: {id, name, description, type, complexity_score, estimated_duration, base_task_hours, etc.}

# Default tasks endpoint structure
curl -s "http://localhost:3002/api/entities/component/1/default-tasks" | ./jq.exe '.data[0]'
# Returns: {id, task_name, estimated_hours, order_index, task_template, etc.}

# Timeline layers endpoint structure
curl -s http://localhost:3002/timeline/layers | ./jq.exe '.[0]'
# Returns: {id, name, order_index, color_hex, is_active, etc.}
```

## **🛠️ TROUBLESHOOTING**

#### **❌ "Lost in Directory Structure"**

```bash
# Problem: Don't know where you are or can't find the right directory
# Solution: Use the safety commands

# Check where you are:
pwd

# Get back to safety (root):
cd "c:\Users\info\Documents\Website Files\ProjectFlo"

# Navigate safely to backend:
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"

# Navigate safely to frontend:
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\frontend"

# Quick verification:
ls -la | grep -E "(package.json|pnpm-workspace|packages/)"
```

#### **❌ "jq Not Found"**

```bash
# Problem: ./jq.exe: command not found
# Solution: Check your location and jq installation

# Verify you're in the right directory:
pwd
ls -la | grep jq.exe

# If in root directory and no jq.exe:
curl -L -o jq.exe https://github.com/stedolan/jq/releases/latest/download/jq-win64.exe
chmod +x jq.exe

# If in backend directory and no jq.exe:
cd "c:\Users\info\Documents\Website Files\ProjectFlo"
cp jq.exe packages/backend/

# Test it works:
./jq.exe --version
```

#### **❌ "Servers Not Responding"**

```bash
# Problem: curl commands failing, can't reach localhost:3001 or localhost:3002
# Solution: Check if servers are actually running

# Verify server status:
curl -s http://localhost:3001 > /dev/null && echo "✅ Frontend (3001): Running" || echo "❌ Frontend (3001): Not running"
curl -s http://localhost:3002/components > /dev/null && echo "✅ Backend (3002): Running" || echo "❌ Backend (3002): Not running"

# If servers aren't running, start them from root:
cd "c:\Users\info\Documents\Website Files\ProjectFlo"
pnpm dev

# If that fails, try starting individually:
# Terminal 1 (Backend):
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"
npm run start:dev

# Terminal 2 (Frontend):
cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\frontend"
npm run dev
```

#### **❌ "Multiple Server Instances Running"**

```bash
# Problem: Accidentally started servers multiple times, conflicting ports
# Symptoms: "Port 3001 already in use" or "Port 3002 already in use"

# Solution: Kill all node processes and restart cleanly
# Windows Git Bash:
taskkill /F /IM node.exe

# Alternative (find specific processes):
netstat -ano | findstr :3001
netstat -ano | findstr :3002
# Note the PID (Process ID) numbers and kill them:
taskkill /F /PID <process_id>

# Then restart servers cleanly:
cd "c:\Users\info\Documents\Website Files\ProjectFlo"
pnpm dev
```

### **🆘 Emergency Reset Procedure:**

```bash
# When everything is broken and you need to start fresh:

# Step 1: Kill all node processes
taskkill /F /IM node.exe

# Step 2: Navigate to root
cd "c:\Users\info\Documents\Website Files\ProjectFlo"
pwd  # Verify location

# Step 3: Verify project structure
ls -la | grep -E "(package.json|pnpm-workspace|packages/)"

# Step 4: Start fresh
pnpm dev
```

### **🎯 Quick Command Reference:**

```bash
# === ESSENTIAL COMMANDS ===
# 📍 Check location:           pwd
# 🏠 Go to root:              cd "c:\Users\info\Documents\Website Files\ProjectFlo"
# 🔧 Go to backend:           cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"
# 🎨 Go to frontend:          cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\frontend"
# 🚀 Start servers:           pnpm dev (from root)
# 🧪 Test API:                curl -s http://localhost:3002/components | ./jq.exe 'length'
# ✅ Health check:            curl -s http://localhost:3001 > /dev/null && echo "✅ Frontend OK"
# 🔄 Emergency reset:         taskkill /F /IM node.exe && cd "c:\...\ProjectFlo"
# 🛑 Stop servers:            Ctrl+C (in terminal running pnpm dev)
```

## **🚨 CRITICAL REMINDERS:**

### **Always Remember:**
- ✅ Use `npx prisma generate` (NOT `prisma generate`)
- ✅ Kill backend server before running database scripts
- ✅ Check your location with `pwd` before running commands
- ✅ Use full paths when navigating: `cd "c:\Users\info\Documents\Website Files\ProjectFlo"`
- ✅ Start from root directory for most operations

### **Before Running Scripts:**
```bash
# 1. Stop backend server (Ctrl+C)
# 2. Navigate to backend: cd "c:\Users\info\Documents\Website Files\ProjectFlo\packages\backend"
# 3. Regenerate Prisma: npx prisma generate
# 4. Run your script: node your-script.js
# 5. Restart server: npm run start:dev
```
