# ProjectFlo Copilot Instructions

## Error learning loop
- On any **systemic mistake** (wrong pattern, wrong assumption about the codebase), log it to `.github/error-ledger.md` before finishing the task.
- If the same pattern appears ≥2 times, or was high-impact, add a rule to the relevant `.github/instructions/*.instructions.md` file and mark the ledger entry Resolved.
- One-off blunders (typos, bracket mismatches) do NOT go in the ledger.
- **NEVER ask the user a question that an instruction file would answer.** Read the relevant instruction file first, then act.

## Do / Don't
- Do use existing layers: frontend `api.ts`/hooks and backend `module -> controller -> service -> prisma`.
- Do place all new backend feature code under one of: `platform`, `catalog`, `workflow`, `content`, `finance`.
- Do keep brand context explicit end-to-end (`BrandProvider` → `X-Brand-Context` → controller → service).
- Do check `SCENE_SAVE_DATA_FLOW.md` before touching timeline save logic.
- Don’t add ad-hoc `fetch` calls in UI when typed API methods/hooks already exist.
- Don’t bypass `PrismaService` with direct DB access outside backend services.
- Don’t auto-start long-running dev servers as an agent; ask user to run `pnpm dev`.
- Agent may stop existing dev servers when needed for the task, but should not start them automatically.
- Agent may delete or remove files and run `rm` commands without asking for confirmation when the intent is clear from context.
## Fast task map
- Auth/session bugs → `packages/frontend/src/app/providers/AuthProvider.tsx` + `packages/backend/src/core/auth/*`
- Brand scoping bugs → see `brand-scoping.instructions.md`
- API request shape/type issues → `packages/frontend/src/lib/api.ts` and `packages/frontend/src/lib/types/*`
- ContentBuilder work → `packages/frontend/CONTENTBUILDER_COMPONENT_GUIDE.md`
- Timeline save/moment persistence → `SCENE_SAVE_DATA_FLOW.md` first
- Data model/migration changes → `packages/backend/prisma/schema.prisma` + `npx prisma generate`
- Pricing/totals bugs → `PRICING_TOTALS_REFERENCE.md` first; after any change, update that file
- Backend architecture questions → see `backend-architecture.instructions.md`
- Deployment/environment/hosting questions → read `deployment.instructions.md` first (Render = backend, Vercel = frontend, Render Postgres = production DB)

## Architecture overview
- Monorepo: `packages/backend` (NestJS + Prisma + PostgreSQL), `packages/frontend` (Next.js 14 + React Query + MUI).
- Backend feature modules grouped under: `platform`, `catalog`, `workflow`, `content`, `finance`.
- Shared DB via `PrismaService` injected into services.
- Frontend API centralized in `packages/frontend/src/lib/api.ts`.
- Auth is JWT-based with refresh flow. Backend: `src/core/auth/`. Frontend: `AuthProvider.tsx` + `authService` in `api.ts`.

## Critical workflows
- Root commands: `pnpm dev` (both apps), `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format`.
- Backend DB workflow (from `packages/backend`): `npx prisma generate`, `npx prisma db push`, `npx prisma db seed`, `npx prisma migrate dev`.
- Auth token tooling: `tools/auth/get-auth-token.js`, `tools/auth/get-dev-token.js`; tokens in `.auth/tokens`.
- Agent script execution: run one-off scripts directly. If the server must be stopped first, print a one-line warning then proceed.

## High-risk files (change carefully)
- `packages/frontend/src/lib/api.ts`
- `packages/frontend/src/app/providers/BrandProvider.tsx`
- `packages/frontend/src/app/providers/AuthProvider.tsx`
- `SCENE_SAVE_DATA_FLOW.md`
- `packages/backend/prisma/schema.prisma`

## Key reference files
- `PRICING_TOTALS_REFERENCE.md` — pricing, estimates, quotes, task costs, payment brackets, milestones
- `SCENE_SAVE_DATA_FLOW.md` — timeline persistence contract
- `packages/frontend/CONTENTBUILDER_COMPONENT_GUIDE.md` — ContentBuilder component layout
- `packages/backend/prisma/schema.prisma` — data model
- `packages/backend/prisma/seeds/README.md` — seed data system (execution order, file inventory, adding new seeds)