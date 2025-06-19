# 🎬 ProjectFlo Frontend

The Next.js frontend application for ProjectFlo, featuring a dual-application architecture serving both admin and client experiences.

## 🏗️ Application Structure

- **🔧 Admin App (`/app-crm/`)**: Internal business management interface
- **👥 Client Portal (`/app-portal/`)**: Future client-facing collaboration space *(planned)*
- **📚 Shared Resources**: Common components, API services, and utilities

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3002

# Start development server
pnpm dev

# Access admin application
open http://localhost:3000/app-crm
```

## 🛠️ Technology Stack

- **Framework:** Next.js 14 (App Router)
- **UI Libraries:** Material-UI + Tailwind CSS
- **State Management:** TanStack Query + React Context
- **Type Safety:** TypeScript with strict mode
- **Authentication:** JWT-based authentication

## 📁 Key Directories

```
src/
├── app/
│   ├── app-crm/                    # Admin Application
│   │   ├── contacts/               # CRM Contact Management
│   │   ├── settings/              # Business Configuration
│   │   │   ├── team/              # Team Management
│   │   │   └── services/          # Services Configuration
│   │   └── layout.tsx             # Admin Layout
│   ├── app-portal/                # Client Portal (Future)
│   └── auth/                      # Authentication Pages
├── components/                     # Shared UI Components
└── lib/                           # API Services & Utilities
```

## 🔧 Development Commands

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript checking
```

## � Documentation

**For complete setup instructions, API documentation, and architecture details, see:**

- **[DevOps Guide](../../Plan/System%20Architecture/DevOps%20Guide.md)** - Complete development setup
- **[System Architecture](../../Plan/System%20Architecture/System%20Architecture.md)** - Application architecture
- **[API Design Spec](../../Plan/System%20Architecture/API%20Design%20Spec.md)** - Backend API reference

## 🎯 Default Login

```
Email: admin@projectflo.com
Password: admin123
```

---

**See the main [ProjectFlo README](../../README.md) for complete project information.**
