# Changelog

All notable changes to ProjectFlo are recorded here, most recent first.

---

## [Unreleased] — March 2026

### 🚀 Deployment (March 21–23, 2026)

- **Production deployment** to Render (backend API) and Vercel (frontend)
- Added `render.yaml` Blueprint for auto-provisioning a PostgreSQL 15 database on Render
- Configured `vercel.json` for pnpm monorepo support on Vercel
- Squashed 103 individual Prisma migrations into a single `0_baseline` migration for clean deploy history; updated `render.yaml` build command to mark baseline as applied on first deploy
- Added [Azimutt](https://azimutt.app/) DBML schema visualisation with a GitHub Actions workflow that auto-regenerates the schema map on every push to `master`
- Fixed several Render build issues: devDependency install order, nest CLI resolution via `pnpm run build`, and corrected start command path (`dist/src/main`)
- Fixed `.gitignore` so `coverage/` exclusion no longer masked `backend/src/content/coverage/` and `frontend/src/components/coverage/` source directories

### 🤖 Agent Instructions (March 23, 2026)

Replaced the single monolithic instructions file with a modular set of domain-specific instruction files under `.github/instructions/`:

| File | Covers |
|------|--------|
| `backend-architecture.instructions.md` | Domain buckets, file naming, service splitting, size limits |
| `api-design.instructions.md` | Route structure, parameter parsing, response conventions |
| `frontend-architecture.instructions.md` | Feature buckets, route ownership, folder shapes, target tree |
| `frontend-conventions.instructions.md` | API calls, components, state, brand context |
| `frontend-design-system.instructions.md` | Design tokens, MUI variants, shared UI components |
| `brand-scoping.instructions.md` | X-Brand-Context, BrandProvider, brand safety checklist |
| `validation.instructions.md` | DTO decorators, ValidationPipe, frontend validation patterns |
| `error-handling.instructions.md` | NestJS exceptions, throw patterns, frontend error display |
| `logging.instructions.md` | LoggerService usage, log levels, anti-patterns |
| `testing.instructions.md` | Jest/NestJS test structure, mocking, what to test |
| `migrations.instructions.md` | Prisma migrate workflow, naming, squashing, backfill scripts |
| `seed-data.instructions.md` | Seed layers, idempotency patterns, orchestrators |
| `typescript-strictness.instructions.md` | Strict mode settings, no-`any` rules, type assertion rules |
| `git-conventions.instructions.md` | Branch naming, commit messages, PR template |
| `deployment.instructions.md` | Render/Vercel/Docker setup, CI/CD, pre-deploy checklist |
| `feature-readmes.instructions.md` | README template for every module folder |

Added `.github/error-ledger.md` for tracking systemic mistakes across agent sessions.

---

### 🛠️ Frontend Build Fixes (March 20, 2026)

Resolved 64 TypeScript compilation errors across the frontend to make the production build pass:

- Fixed type mismatches in components, hooks, and API utilities
- Corrected `ApiService` vs `ApiClient` protected/public method access patterns
- Fixed `ScenesLibrary` import paths (`media.ts` vs `domains/scenes.ts`)
- Converted API date strings to `Date` objects in sales mappers
- Added missing type definitions (locations, timeline, needs-assessment)
- Removed duplicate properties/methods (`coverage`, `moments` API)
- Fixed MUI v5 compatibility: `keyframes` import, `PointerSensor` config
- Replaced broken `MomentsManagement` block comments with a stub
- Added `Suspense` boundary for `useSearchParams` on login page
- Fixed `tsconfig` `ignoreDeprecations` value for TypeScript 5.8
- Fixed type predicates, empty array inference, and null handling

---

### 📞 Discovery Call UX (March 20, 2026)

- **Two-column layout** for the Discovery Call card in the inquiry pipeline
- Revised call-opening script to use natural, conversational language instead of scripted phrases
- **Moved transcript consent** below the opening intro so the flow feels seamless
- Renamed "Call Recording Consent" → "Transcript Consent" with a simpler prompt
- Expanded `SectionStatus` type on the portal to include `review` states

---

### ⚙️ Pipeline Automation & Crew Management (March 19, 2026)

**Bug fixes:**
- Fixed "Qualify & Respond" phase auto-completing before the consultant acted (removed premature auto-complete from status handler)
- Fixed `resolve_availability_conflicts` subtask auto-completing when it shouldn't (`is_auto_only: true`; `syncResolveConflicts` now checks all crew **and** equipment)
- Fixed `QualifyCard` checking the wrong subtask for conflict warnings
- Fixed `AvailabilityCard` not refreshing pipeline tasks after crew/equipment actions

**Crew reassignment:**
- Fixed crew reassignment 404 error (now uses `projectDayOperator` instead of `packageDayOperator`)
- Added project-level crew assignment endpoint and matching API method on the frontend
- Fixed "crew alternatives" showing all brand contributors instead of only role-matched ones
- Alternative crew chips now show conflict indicators with descriptive tooltips
- Crew swap triggers an estimate staleness re-check via a `refreshKey` prop

---

### 🌐 Client Portal — Major Feature (March 16, 2026)

A fully public-facing client portal with no authentication required:

**Backend:**
- New `ClientPortalService` with section-gated data fetching (estimate, proposal, contract, invoices, needs assessment)
- Public controllers for client portal, needs assessments, and proposals (JWT-free routes)
- Portal token generation tied to inquiry access
- Contract clauses/templates system with seeding scripts
- Discovery questionnaire module

**Frontend:**
- Interactive portal page with expandable cards and a glassmorphic dark-themed design
- Client journey progress tracker
- Estimate card redesigned: grouped by category with coloured headers, per-category subtotals, and a summary sidebar
- Needs assessment public submission page
- Proposal review and signing pages
- Client portal settings, contract settings, and proposal settings in the Studio UI
- Renamed "Consultation" phase → **"Proposal Review"** (database migration included)

---

### ⚙️ Settings & Navigation Restructure (March 13, 2026)

- Extracted `FormsSettings` component from `manager/sales/page.tsx` into `settings/_components/FormsSettings.tsx`
- Added **Forms** as a dedicated tab in the Settings page (alongside Profile, Brand, etc.)
- Sidebar updated: Inquiries and Customers promoted to top-level items; Forms moved under Settings
- Fixed estimate task auto-completion to only trigger after the estimate is sent or accepted
- Added `pipeline_stage` computed field to the inquiries list endpoint
- Replaced the **Status** column with a **Pipeline Stage** chip in the inquiries table; removed the Source column

---

### 🎬 Film, Content & Finance Features (March 13, 2026)

- **Film structure templates** for defining scene/moment blueprints per event type
- **Montage presets** for quick content-builder layouts
- **Audio sources** management
- **Inquiry tasks**: auto-generated tasks tied to inquiry stages
- **Payment schedules**: milestone-based payment plan generation and editing
- Calendar event management improvements
- Content Builder performance and UX improvements

---

### 📋 PhaseOverview Redesign & Schedule Instances (March 9, 2026)

**PhaseOverview UI:**
- Phase icons enlarged (38px overview / 50px active), hover tooltips show per-phase task checklists
- Click-to-scroll navigation with a glow highlight animation on the destination section
- Compact single-row step chips replacing the previous two-row card layout
- Stronger card styling with layered glow effects
- Fixed "Post-Counsultation" typo

**Schedule Instance System (per-project/inquiry scheduling):**
- `InstanceScheduleEditor` — edit a project or inquiry's schedule independently of the source package
- `ScheduleApiContext` with package / project / inquiry adapters
- `useInstanceScheduleData` hook with field normalisation
- `ScheduleDiffView` — visual comparison between the instance schedule and its source package template
- `PackageScheduleSummary` and `ProposalSchedulePreview` components
- `FilmApiContext` with library / project / inquiry mode adapters
- `PackageScheduleTab` for project-level schedule management

**Other:**
- `VenueMap` component using dark Leaflet tiles
- `SalesBudgetCard` component
- Package review page for pre-booking schedule preview
- Various backend schedule and inquiry endpoint updates

---

### 📦 Package Management & Resources (March 7, 2026)

- **Package sets with tier slots** — Basic, Standard, Premium, Budget, Custom tiers
- Package creation wizard with event-type selection
- Package picker dialog with brand filtering
- **Task library** expansion: trigger-based task generation, skill mappings, auto-assignment
- **Crew management**: skill-to-role mappings, payment brackets
- **Equipment management**: unmanned device support
- Schedule presets with activity moments
- Event types and wedding-type templates
- Contributors controller and service enhancements
- Dark theme foundational work and auth-provider updates

---

### 🌙 Dark Theme & Wedding Templates (February 28, 2026)

- Dark theme implemented across all Studio pages
- Enhanced wedding-type templates with pre-populated locations, subjects, and detailed moment definitions

---

## Previous Milestones

| Date | Description |
|------|-------------|
| Sep 2026 | Refresh token flow to prevent automatic logout |
| Sep 2026 | Major project cleanup and reorganisation |
| Jul 2026 | Calendar system, ContentBuilder overhaul, scene management |
| Jul 2026 | Auth improvements (401/403 handling, token refresh) |
| Jul 2026 | Backend domain-based folder restructuring |
