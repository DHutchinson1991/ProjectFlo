# 🎬 ProjectFlo - The Creative OS

**A comprehensive project management platform designed for creative agencies, specifically optimized for wedding videography businesses.**

## 🚀 Quick Start

### Prerequisites
- **Node.js** v20 or higher
- **pnpm** v8.15.9+ (specified in package.json)
- **PostgreSQL** database

### Development Setup
```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd ProjectFlo
pnpm install

# 2. Set up environment variables
# Backend (.env in packages/backend/):
# DATABASE_URL="postgresql://username:password@localhost:5432/projectflo_db"
# JWT_SECRET="your-secret-key-here"

# Frontend (.env.local in packages/frontend/):
# NEXT_PUBLIC_API_URL="http://localhost:3002"

# 3. Set up database
cd packages/backend
npx prisma generate
npx prisma db push
npx prisma db seed

# 4. Start development servers (from project root)
pnpm dev
# OR start separately:
# Terminal 1 - Backend: cd packages/backend && pnpm start:dev
# Terminal 2 - Frontend: cd packages/frontend && pnpm dev
```

### Access Points
- **Admin Dashboard:** http://localhost:3001/app-crm
- **API Documentation:** http://localhost:3002/api (Swagger UI)
- **Database GUI:** `npx prisma studio` (from packages/backend)

### Default Login
```
Email: admin@projectflo.com
Password: admin123
```

### Quick Commands
```bash
# Development
pnpm dev             # Start both frontend and backend
pnpm build           # Build all packages
pnpm test            # Run all tests
pnpm lint            # Lint all code
pnpm format          # Format all code

# Database (from packages/backend/)
npx prisma studio    # Open database GUI
npx prisma db push   # Apply schema changes
npx prisma db seed   # Seed database with test data
npx prisma generate  # Regenerate Prisma client
```

### Troubleshooting
- **Prisma errors**: Run `npx prisma generate` from packages/backend
- **TypeScript errors**: Restart IDE TypeScript server (VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server")
- **Port conflicts**: Frontend runs on port 3001, backend on port 3002
- **Database connection**: Verify DATABASE_URL in backend .env file

## 🏗️ Architecture Overview

ProjectFlo uses a **dual-application architecture**:

- **🔧 Admin App (`/app-crm/`)**: Internal business management interface
- **👥 Client Portal (`/app-portal/`)**: Future client-facing collaboration space *(planned)*
- **📚 Shared Resources**: Common components, API services, and utilities

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, Material-UI, TanStack Query, TypeScript
- **Backend:** NestJS, PostgreSQL, Prisma ORM, JWT Authentication
- **Development:** pnpm workspaces, ESLint, Prettier, Husky

## 📚 Documentation

**Complete documentation is available in the `/Plan/` directory:**

### 🗺️ Project Management
- **[Development Roadmap](./Plan/Implementation/Development%20Roadmap.md)** - Updated development phases aligned with current codebase implementation status
- **[Project Charter](./Plan/Business/Project%20Charter.md)** - Project overview and objectives

### 🏗️ Technical Architecture
- **[System Architecture](./Plan/Architecture/System%20Architecture.md)** - Core architectural principles and technology decisions
- **[API Design Spec](./Plan/Technical%20Reference/Technical/API%20Design%20Spec.md)** - Complete API documentation with endpoints and examples
- **[DevOps Guide](./Plan/Technical%20Reference/Technical/DevOps%20Guide.md)** - Development setup, deployment, and operations

### 📊 Business & Design
- **[Database Schema](./Plan/Data/Database%20Schema.md)** - Database schema and relationships
- **[Product Requirements](./Plan/Product%20Requirements/)** - Feature specifications and user stories

## 🎯 Current Status

**✅ Phase 1 Completed (June 2025):**
- Full authentication system with JWT
- Complete CRUD operations for team, contacts, and services
- Professional admin interface with Material-UI
- Type-safe API integration with React Query
- Production-ready error handling and validation

**🚧 Next Phase:**
- Sales pipeline and client onboarding workflows
- Project creation and management systems
- Client portal development (`/app-portal/`)

## 🤝 Development

### Quick Commands
```bash
# Development
pnpm -r dev          # Start all development servers
pnpm -r build        # Build all packages
pnpm -r test         # Run all tests
pnpm lint            # Run linting

# Database (from packages/backend)
npx prisma studio    # Database GUI
npx prisma db push   # Apply schema changes
npx prisma db seed   # Seed database
```

### Development Resources
- **📖 [DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete development setup and troubleshooting guide
- **Setup Instructions:** [DevOps Guide](./Plan/Technical%20Reference/Technical/DevOps%20Guide.md)
- **API Reference:** [API Design Spec](./Plan/Technical%20Reference/Technical/API%20Design%20Spec.md)
- **Architecture Details:** [System Architecture](./Plan/Architecture/System%20Architecture.md)

---

**Built with ❤️ for creative professionals**
