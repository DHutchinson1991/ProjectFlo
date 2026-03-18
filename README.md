<div align="center">

# 🎬 ProjectFlo

### The Creative OS

**An all-in-one business management platform for creative agencies — purpose-built for wedding videography studios.**

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![pnpm](https://img.shields.io/badge/pnpm-8-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-Private-red)](#license)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [Database](#database)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ProjectFlo is a **comprehensive creative agency operating system** that handles the entire wedding videography business lifecycle — from the first client inquiry through to final film delivery. It replaces the patchwork of spreadsheets, generic CRMs, and project management tools with a single, integrated platform designed specifically for how creative studios actually work.

### Who is this for?

- **Wedding videography studios** managing multiple bookings, crews, and deliverables
- **Creative agencies** that need integrated sales pipelines, project management, and content production workflows
- **Studio owners** who want visibility across their entire business in one dashboard

---

## Features

### 📊 Sales & Lead Management
- **Inquiry pipeline** — Track leads from first contact through booking with guided workflow phases
- **Needs assessment** — Structured discovery questionnaires tailored to wedding types
- **Estimates & quotes** — Generate detailed cost breakdowns with configurable pricing tiers
- **Proposals** — Build and send client proposals with package selections
- **Contracts & invoices** — End-to-end deal closure with document management

### 🎬 Content & Film Production
- **Film designer** — Visual timeline editor for planning film structure (scenes, moments, beats)
- **Content builder** — Drag-and-drop interface for constructing film deliverables
- **Subject tracking** — Manage people, locations, and elements across film scenes
- **Music library** — Organize and assign music tracks to scenes
- **Coverage planning** — Map camera assignments and recording setups per scene

### 📅 Project & Schedule Management
- **Project dashboard** — Centralized view of all active projects with status tracking
- **Schedule system** — Event day planning with activity presets, timelines, and crew assignments
- **Instance scheduling** — Per-project schedule instances with snapshot versioning
- **Package management** — Service packages with tiers, event days, and activity templates

### 👥 Resource Management
- **Crew management** — Track team members, skills, roles, and availability
- **Equipment tracking** — Inventory management with assignment templates
- **Location library** — Venue database with address search and map integration
- **Operator assignments** — Map crew to equipment and film roles

### 🏢 Business Operations
- **Multi-brand support** — Run multiple brands from a single instance with full data isolation
- **Role-based access** — JWT authentication with configurable user roles per brand
- **Task library** — Reusable task templates with skill mapping and trigger-based generation
- **Workflow engine** — Customizable business workflows for different project types
- **Activity logging** — Full audit trail across all business operations
- **Calendar** — Integrated scheduling with event management

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router) | React framework with SSR/SSG |
| **UI Library** | [Material UI 5](https://mui.com/) | Component library with custom dark theme |
| **State/Data** | [TanStack Query 5](https://tanstack.com/query) | Server state management & caching |
| **Drag & Drop** | [@dnd-kit](https://dndkit.com/) / [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) | Sortable interfaces |
| **Maps** | [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/) | Venue mapping & address search |
| **Canvas** | [Fabric.js](http://fabricjs.com/) / [SVG.js](https://svgjs.dev/) | Visual design tools |
| **Backend** | [NestJS 11](https://nestjs.com/) | Node.js API framework |
| **ORM** | [Prisma 6](https://www.prisma.io/) | Type-safe database client |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Relational database |
| **Auth** | [Passport.js](http://www.passportjs.org/) + JWT | Authentication & authorization |
| **Monorepo** | [pnpm Workspaces](https://pnpm.io/workspaces) | Package management |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | End-to-end type safety |

---

## Architecture

ProjectFlo is a **pnpm monorepo** with two main packages:

```
ProjectFlo/
├── packages/
│   ├── backend/     → NestJS REST API (port 3002)
│   └── frontend/    → Next.js App Router (port 3001)
├── tools/           → Auth utilities & developer scripts
└── test/            → Integration test harness
```

### Backend (NestJS)

Domain-driven module architecture following the NestJS pattern: `Module → Controller → Service → Prisma`.

**Domain modules:**

| Domain | Modules |
|--------|---------|
| **Core** | Auth, Users/Contributors, Roles, Contacts |
| **Sales** | Inquiries, Clients, Proposals, Estimates, Quotes, Contracts, Invoices |
| **Content** | Films, Scenes, Moments, Beats, Coverage, Music, Subjects, Locations, Schedule, Instance Films |
| **Business** | Brands, Service Packages, Package Sets, Task Library, Workflows, Wedding Types, Event Types, Skill Role Mappings |
| **Resources** | Equipment, Operators, Crew, Calendar, Locations Library |
| **Platform** | Activity Logs, Payment Brackets, Job Roles, Needs Assessments |

### Frontend (Next.js)

App Router with route groups and a centralized API client:

| Route Group | Purpose |
|-------------|---------|
| `/(studio)/dashboard` | Main business dashboard |
| `/(studio)/sales/*` | Inquiry pipeline, clients, needs assessments |
| `/(studio)/projects/*` | Project management & service configuration |
| `/(studio)/designer/*` | Film designer, content builder, templates |
| `/(studio)/manager/*` | Crew, equipment, locations, tasks, workflows, sales ops |
| `/(studio)/calendar` | Calendar & scheduling |
| `/(studio)/resources` | Resource management |
| `/(studio)/settings` | System configuration |

### Key Design Decisions

- **Multi-tenant brand scoping** — Every request carries brand context (`X-Brand-Context` header); data is isolated per brand at the service layer
- **Centralized API client** — All frontend API calls flow through `src/lib/api.ts` with typed methods, automatic auth token injection, and brand context
- **React Query for server state** — Consistent cache invalidation with brand-aware query keys
- **Dark glassmorphism UI** — Custom design system with semi-transparent surfaces and backdrop blur

---

## Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| **Node.js** | v20+ |
| **pnpm** | v8.15.9+ |
| **PostgreSQL** | v14+ |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/DHutchinson1991/ProjectFlo.git
cd ProjectFlo

# 2. Install dependencies
pnpm install
```

### Environment Setup

Create environment files in each package:

**Backend** — `packages/backend/.env`
```env
DATABASE_URL="postgresql://username:password@localhost:5432/projectflo_db"
JWT_SECRET="your-secret-key-here"
```

**Frontend** — `packages/frontend/.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:3002"
```

### Database Setup

```bash
cd packages/backend

# Generate Prisma client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push

# Seed with initial data
npx prisma db seed
```

### Start Development Servers

```bash
# From project root — starts both frontend & backend concurrently
pnpm dev
```

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3001 |
| **Backend API** | http://localhost:3002 |
| **Prisma Studio** | http://localhost:5555 (run `npx prisma studio` from `packages/backend`) |

### Default Credentials

```
Email:    admin@projectflo.com
Password: admin123
```

---

## Project Structure

```
ProjectFlo/
├── packages/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Database schema (4,000+ lines)
│   │   │   ├── migrations/            # 60+ versioned migrations
│   │   │   └── seeds/                 # Database seed scripts
│   │   └── src/
│   │       ├── core/                  # Auth, users, roles, contacts
│   │       ├── content/               # Films, scenes, moments, schedule
│   │       ├── business/              # Brands, packages, tasks, workflows
│   │       ├── projects/              # Project management
│   │       ├── inquiries/             # Lead/inquiry pipeline
│   │       ├── proposals/             # Proposal generation
│   │       ├── estimates/             # Cost estimation
│   │       ├── quotes/                # Quote management
│   │       ├── contracts/             # Contract handling
│   │       ├── invoices/              # Invoice management
│   │       ├── equipment/             # Equipment tracking
│   │       ├── crew/                  # Crew management
│   │       ├── calendar/              # Calendar & events
│   │       ├── locations/             # Location library
│   │       └── prisma/                # Shared Prisma service
│   │
│   └── frontend/
│       └── src/
│           ├── app/
│           │   └── (studio)/          # Main app route group
│           │       ├── dashboard/     # Business dashboard
│           │       ├── sales/         # Inquiry pipeline & clients
│           │       ├── projects/      # Project management
│           │       ├── designer/      # Film designer & content builder
│           │       ├── manager/       # Resource management
│           │       ├── calendar/      # Calendar view
│           │       └── settings/      # Configuration
│           ├── components/            # Shared UI components
│           ├── hooks/                 # Custom React hooks
│           ├── lib/                   # API client, utilities, types
│           └── types/                 # TypeScript type definitions
│
├── tools/
│   └── auth/                          # Auth token utilities
├── test/                              # Integration tests
├── pnpm-workspace.yaml                # Workspace configuration
└── package.json                       # Root scripts & dependencies
```

---

## Development

### Commands

All commands run from the **project root** unless noted otherwise.

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start both frontend and backend in development mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests across all packages |
| `pnpm lint` | Lint all code |
| `pnpm lint:fix` | Lint and auto-fix |
| `pnpm format` | Format with Prettier |

#### Backend-specific (from `packages/backend/`)

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start backend with hot reload |
| `npm run start:debug` | Start with debugger attached |
| `npm test` | Run Jest tests |
| `npm run test:e2e` | Run end-to-end tests |

#### Frontend-specific (from `packages/frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (port 3001) |
| `npm run build` | Production build |
| `npm run lint` | Next.js linting |

### Code Conventions

- **Backend:** NestJS module pattern (`Module → Controller → Service → Prisma`). DTOs for request validation. PrismaService for all database access.
- **Frontend:** API calls through `src/lib/api.ts` (never raw `fetch` in components). React Query hooks for data fetching. MUI components with the project's dark theme.
- **Brand scoping:** Every data request must include brand context. Frontend injects via `BrandProvider`; backend filters at the service layer.
- **TypeScript:** Strict mode. Minimize `any` usage. Shared types in `src/lib/types/` and `src/types/`.

---

## Database

### Schema Overview

The Prisma schema (`packages/backend/prisma/schema.prisma`) contains **4,000+ lines** defining the complete data model across all domains.

### Key Commands

Run from `packages/backend/`:

```bash
npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma migrate dev       # Create and apply a new migration
npx prisma db push           # Push schema changes (dev only, no migration)
npx prisma db seed           # Seed database with initial data
npx prisma studio            # Open visual database browser
npx prisma db push --force-reset && npx prisma db seed  # Full reset
```

> **Important:** Always use `npx prisma` (not global `prisma`) to ensure the correct project version is used.

### Migration History

The project has **60+ migrations** tracking the full evolution of the data model from initial setup through the current feature set.

---

## API Reference

The backend exposes a RESTful API at `http://localhost:3002`. Key endpoint groups:

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | JWT authentication |
| `GET /contributors` | Team member management |
| `GET /contacts` | Client contact directory |
| `GET /projects` | Project CRUD |
| `GET /inquiries` | Inquiry pipeline |
| `GET /proposals` | Proposal management |
| `GET /estimates` | Cost estimates |
| `GET /quotes` | Quote generation |
| `GET /contracts` | Contract management |
| `GET /invoices` | Invoice management |
| `GET /films` | Film library |
| `GET /equipment` | Equipment inventory |
| `GET /crew` | Crew management |
| `GET /calendar` | Calendar events |
| `GET /locations` | Location library |
| `GET /needs-assessments` | Needs assessment forms |
| `GET /service-packages` | Service package configuration |

All authenticated endpoints require: `Authorization: Bearer <token>`

Brand-scoped endpoints also require: `X-Brand-Context: <brandId>`

---

## Roadmap

### ✅ Completed

- Full JWT authentication with refresh flow
- Multi-brand architecture with data isolation
- Inquiry pipeline with guided workflow phases
- Needs assessment with configurable questionnaires
- Estimate, quote, proposal, contract & invoice management
- Film designer with scenes, moments, beats, and coverage
- Content builder with drag-and-drop interface
- Equipment & crew management with templates
- Schedule system with event day planning and presets
- Package configuration with tiers, sets, and slots
- Task library with trigger-based generation and skill mapping
- Venue/location management with map integration
- Dark glassmorphism UI with custom design system

### 🚧 In Progress

- Client portal for external collaboration
- Advanced reporting and analytics dashboard
- Automated workflow triggers and notifications

### 🗺️ Planned

- Calendar integrations (Google Calendar, Outlook)
- File storage and asset management
- Mobile companion app
- Multi-currency and i18n support

---

## Contributing

ProjectFlo is currently a private project. If you have access to the repository:

1. Create a feature branch from `develop`
2. Follow the existing code conventions (see [Development](#development))
3. Ensure TypeScript compiles without errors
4. Test your changes locally with `pnpm dev`
5. Submit a pull request to `develop`

---

## License

This project is **private and proprietary**. All rights reserved.

---

<div align="center">

**Built with ❤️ for creative professionals**

[Report Bug](https://github.com/DHutchinson1991/ProjectFlo/issues) · [Request Feature](https://github.com/DHutchinson1991/ProjectFlo/issues)

</div>
