# 🛠️ ProjectFlo Development Guide

**Quick reference for running and developing ProjectFlo locally.**

## 🚀 Quick Start (TL;DR)

```bash
# 1. Install dependencies
pnpm install

# 2. Set up database (first time only)
cd packages/backend
npx prisma generate && npx prisma db push && npx prisma db seed

# 3. Start development (from project root)
pnpm dev

# 4. Access the app
# Admin Dashboard: http://localhost:3001/app-crm
# API Docs: http://localhost:3002/api
# Login: admin@projectflo.com / admin123
```

## 📋 Environment Setup

### Required Environment Variables

**Backend** (`packages/backend/.env`):
```env
DATABASE_URL="postgresql://username:password@localhost:5432/projectflo_db"
JWT_SECRET="your-secret-key-here"
```

**Frontend** (`packages/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:3002"
```

## 🔧 Development Commands

### Primary Commands (from project root)
```bash
pnpm dev             # Start both servers (recommended)
pnpm build           # Build all packages
pnpm test            # Run all tests
pnpm lint            # Lint code
pnpm format          # Format code with Prettier
```

### Backend Commands (from packages/backend/)
```bash
pnpm start:dev       # Start backend in development mode
pnpm build           # Build backend
npx prisma studio    # Open database GUI
npx prisma generate  # Regenerate Prisma client
npx prisma db push   # Apply schema changes to database
npx prisma db seed   # Seed database with test data
```

### Frontend Commands (from packages/frontend/)
```bash
pnpm dev             # Start frontend development server
pnpm build           # Build frontend for production
pnpm start           # Start built frontend
```

## 🌐 Application Access

| Component | URL | Purpose |
|-----------|-----|---------|
| **Admin Dashboard** | http://localhost:3001/app-crm | Main application interface |
| **API Documentation** | http://localhost:3002/api | Swagger API docs |
| **Database GUI** | http://localhost:5555 | Prisma Studio (when running) |

## 🔑 Default Credentials

```
Email: admin@projectflo.com
Password: admin123
```

## 🏗️ Project Structure

```
ProjectFlo/
├── packages/
│   ├── backend/          # NestJS API (Port 3002)
│   │   ├── prisma/       # Database schema & migrations
│   │   └── src/          # Backend source code
│   └── frontend/         # Next.js App (Port 3001)
│       └── src/          # Frontend source code
├── package.json          # Root package.json with workspace scripts
└── pnpm-workspace.yaml   # pnpm workspace configuration
```

## 🐛 Common Issues & Solutions

### Database Issues
```bash
# Prisma client out of sync
cd packages/backend
npx prisma generate

# Database schema out of sync
npx prisma db push

# Need fresh data
npx prisma db seed
```

### TypeScript Issues
```bash
# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Regenerate Prisma types after schema changes
cd packages/backend
npx prisma generate

# Alternative: Generate from project root
pnpm --filter backend exec prisma generate
```

### IDE TypeScript Server Issues
- **VS Code**: If you see Prisma type errors (e.g., `Module '@prisma/client' has no exported member 'PrismaClient'`), restart the TypeScript server:
  - Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
  - Type "TypeScript" and select "TypeScript: Restart TS Server"
  - If issues persist, restart VS Code completely

### Port Conflicts
- Frontend: Port 3001 (not 3000)
- Backend: Port 3002
- Prisma Studio: Port 5555

### Dependency Issues
```bash
# Clean install
rm -rf node_modules packages/*/node_modules
pnpm install

# Specific package issues
pnpm --filter backend install
pnpm --filter frontend install
```

## 📖 Additional Documentation

- **[DevOps Guide](./Plan/Technical%20Reference/Technical/DevOps%20Guide.md)** - Production deployment and infrastructure
- **[System Architecture](./Plan/Architecture/System%20Architecture.md)** - Technical architecture overview
- **[API Documentation](./Plan/Technical%20Reference/Technical/API%20Design%20Spec.md)** - Detailed API specs
- **[Feature Requirements](./Plan/User%20Requirements/Feature%20Requirements.md)** - Feature specifications

## 🎯 Development Workflow

1. **Start Development**: `pnpm dev`
2. **Make Changes**: Edit code in `packages/backend/` or `packages/frontend/`
3. **Test Changes**: Both servers auto-reload on file changes
4. **Database Changes**: Update `packages/backend/prisma/schema.prisma` → `npx prisma db push`
5. **Commit**: Use `pnpm lint` and `pnpm format` before committing

## 🔄 Database Development Cycle

1. **Modify Schema**: Edit `packages/backend/prisma/schema.prisma`
2. **Apply Changes**: `npx prisma db push`
3. **Regenerate Client**: `npx prisma generate` (usually automatic)
4. **Seed Data**: `npx prisma db seed` (if needed)
5. **View Data**: `npx prisma studio`

---

**💡 Pro Tip**: Keep this file bookmarked for quick reference during development!
