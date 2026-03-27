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

Modules are grouped into five domain buckets under `src/`:

| Bucket | Responsibilities |
|--------|-----------------|
| **`platform`** | Auth, Users/Contributors, Roles, Contacts, Activity Logs, Job Roles, Needs Assessments, Payment Brackets |
| **`catalog`** | Brands, Service Packages, Package Sets, Task Library, Skill Role Mappings, Wedding Types, Event Types |
| **`workflow`** | Inquiries, Proposals, Estimates, Quotes, Contracts, Invoices, Projects |
| **`content`** | Films, Scenes, Moments, Beats, Coverage, Music, Subjects, Schedule, Instance Films, Locations |
| **`finance`** | Billing, Payment processing, Financial reporting |

### Frontend (Next.js)

App Router with route groups. Feature code lives in `src/features/<bucket>/<feature>/`; cross-domain primitives in `src/shared/`; routes in `src/app/`.

| Route Group | Purpose |
|-------------|---------|
| `/(studio)/dashboard` | Main business dashboard |
| `/(studio)/sales/*` | Inquiry pipeline, clients, needs assessments |
| `/(studio)/projects/*` | Project management & service configuration |
| `/(studio)/designer/*` | Film designer, content builder, templates |
| `/(studio)/manager/*` | Crew, equipment, locations, tasks, workflows, sales ops |
| `/(studio)/calendar` | Calendar & scheduling |
| `/(studio)/settings` | System configuration |

### Key Design Decisions

- **Multi-tenant brand scoping** — Every request carries brand context (`X-Brand-Context` header); data is isolated per brand at the service layer
- **Feature-bucketed frontend** — API bindings, hooks, components, and types live in `features/<bucket>/<feature>/` co-located with the code that uses them; `src/lib/api.ts` is legacy-read-only
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
JWT_REFRESH_SECRET="your-refresh-secret-here"
```

**Frontend** — `packages/frontend/.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:3002"
```

> **Production:** Backend is hosted on [Render](https://render.com) (web service + managed PostgreSQL). Frontend is deployed to [Vercel](https://vercel.com). See `render.yaml` and `packages/frontend/vercel.json` for deployment configuration.

### Database Setup

All database commands run from the **project root**:

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (creates all tables)
pnpm db:push

# Seed with initial data
pnpm db:seed
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
| **Prisma Studio** | http://localhost:5555 (run `pnpm db:studio` from root) |

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
│   │   │   ├── schema.prisma          # Database schema
│   │   │   ├── migrations/            # Versioned migration history
│   │   │   ├── seeds/                 # Seed orchestrators & data scripts
│   │   │   └── utils/                 # Seed logging & metrics helpers
│   │   └── src/
│   │       ├── platform/              # Auth, users, roles, activity logs
│   │       ├── catalog/               # Brands, packages, task library, wedding types
│   │       ├── workflow/              # Inquiries, proposals, estimates, quotes, contracts
│   │       ├── content/               # Films, scenes, schedule, subjects, music
│   │       └── finance/               # Billing & financial operations
│   │
│   └── frontend/
│       └── src/
│           ├── app/
│           │   ├── (studio)/          # Main app route group (all authenticated routes)
│           │   └── providers/         # Auth, Brand, Theme context providers
│           ├── features/              # Domain feature code (co-located API, hooks, components)
│           │   ├── platform/          # Auth, users, settings
│           │   ├── catalog/           # Packages, tasks, wedding types
│           │   ├── workflow/          # Inquiries, proposals, estimates, quotes
│           │   ├── content/           # Films, designer, schedule
│           │   └── finance/           # Billing UI
│           ├── shared/                # Cross-domain primitives (components, hooks, utils)
│           └── lib/                   # Legacy API client & types (read-only)
│
├── tools/
│   └── auth/                          # Auth token utilities for development
├── test/                              # Integration tests
├── pnpm-workspace.yaml                # Workspace configuration
└── package.json                       # Root scripts & dependencies
```

---

## Development

### Commands

All commands run from the **project root**.

#### General

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start both frontend and backend in development mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests across all packages |
| `pnpm lint` | Lint all code |
| `pnpm lint:fix` | Lint and auto-fix |
| `pnpm format` | Format with Prettier |
| `pnpm check` | Typecheck + lint both packages |

#### Database

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
| `pnpm db:push` | Push schema changes to DB (dev only, no migration file) |
| `pnpm db:migrate` | Create and apply a named migration |
| `pnpm db:seed` | Seed database with initial data |
| `pnpm db:studio` | Open Prisma Studio at http://localhost:5555 |
| `pnpm db:reset` | Force-reset DB and re-seed |

#### Auth (development tokens)

| Command | Description |
|---------|-------------|
| `pnpm auth:token` | Generate a Moonrise dev auth token |
| `pnpm auth:refresh` | Silent refresh of stored tokens |

### Code Conventions

- **Backend:** NestJS module pattern (`Module → Controller → Service → Prisma`). DTOs for all request validation. `PrismaService` for all database access — never raw queries.
- **Frontend:** New API bindings go in `features/<bucket>/<feature>/api/`. React Query hooks for data fetching. Never use raw `fetch` in components. `src/lib/api.ts` is legacy-read-only.
- **Brand scoping:** Every data request must include brand context. Frontend injects via `BrandProvider`; backend filters at the service layer using `X-Brand-Context`.
- **TypeScript:** Strict mode with `noImplicitAny`. New types go in `features/<bucket>/<feature>/types/` or `shared/types/` — not `src/lib/types/` (legacy-frozen).

---

## Database

### Schema Overview

The Prisma schema (`packages/backend/prisma/schema.prisma`) defines the complete data model across all five domain buckets.

### Key Commands

All run from the **project root** via the `pnpm db:*` namespace:

```bash
pnpm db:generate      # Regenerate Prisma client after schema changes
pnpm db:migrate       # Create and apply a new migration (prompts for name)
pnpm db:push          # Push schema changes without a migration file (dev only)
pnpm db:seed          # Seed database with initial data
pnpm db:studio        # Open visual database browser at :5555
pnpm db:reset         # Force-reset and re-seed (destructive — dev only)
```

### Seed System

Seeds are orchestrated via `prisma/seeds/index.ts`, which delegates to per-brand setup files:
- `moonrise-complete-setup.seed.ts` — Moonrise demo brand with full sample data
- `layer5-complete-setup.seed.ts` — Layer5 demo brand with full sample data

Admin infrastructure (`admin-system.seed.ts`, `system-infrastructure.seed.ts`, `global-job-roles.seed.ts`) is applied first before any brand data.

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
