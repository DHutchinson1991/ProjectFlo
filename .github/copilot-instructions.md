# ProjectFlo Copilot Instructions

## Error learning loop
- On any **systemic mistake** (wrong pattern, wrong assumption about the codebase), log it to `.github/error-ledger.md` before finishing the task.
- If the same pattern appears ≥2 times, or was high-impact, add a rule to the relevant `.github/instructions/*.instructions.md` file and mark the ledger entry Resolved.
- One-off blunders (typos, bracket mismatches) do NOT go in the ledger.
- **NEVER ask the user a question that an instruction file would answer.** Read the relevant instruction file first, then act.

## Refactor discipline
- **When executing a refactor:** `refactoring-safety.instructions.md` is the canonical process gate.
- Follow it sequentially with no shortcuts: baseline `pnpm test`, checklist, refactor, then `pnpm test` + `pnpm build` + `pnpm lint:fix`.
- Use domain-specific instruction files for implementation details; do not duplicate those rules here.
- Violations of this sequence are high-impact and logged to error-ledger.md.

## Do / Don't
- Do use existing layers: frontend `features/<bucket>/<feature>/api/` + hooks and backend `module -> controller -> service -> prisma`.
- Do place all new backend feature code under one of: `platform`, `catalog`, `workflow`, `content`, `finance`.
- Do keep brand context explicit end-to-end (`BrandProvider` → `X-Brand-Context` → controller → service).
- **Do update the feature `README.md` in the same task as any refactor or code change** that alters key files, business rules, hooks, or cross-module relationships. See `feature-readmes.instructions.md` for format.

- Don’t add ad-hoc `fetch` calls in UI when typed API methods/hooks already exist.
- Don’t bypass `PrismaService` with direct DB access outside backend services.
- **Don't add new code to `lib/types/`** — it is legacy-frozen. New endpoint bindings → `features/<bucket>/<feature>/api/`. New types → `features/<bucket>/<feature>/types/` or `shared/types/`. See `frontend-architecture.instructions.md` § "Legacy-frozen folders".
- Don’t auto-start long-running dev servers as an agent; ask user to run `pnpm dev`.
- Agent may stop existing dev servers when needed for the task, but should not start them automatically.
- Agent may delete or remove files and run `rm` commands without asking for confirmation when the intent is clear from context.
## Process hygiene (CRITICAL — prevents VS Code crashes)

**Context:** Up to 4 agents run concurrently in this workspace. Each terminal command spawns Node processes. 4 agents × 5 commands = 20+ Node processes = VS Code crash. Every agent MUST treat terminal use as a scarce, shared resource.

### Terminal budget
- **Max 3 terminal commands per agent per task.** If you need more, you are doing something wrong — use non-terminal tools instead.
- **Combine commands with `&&`** into a single call: e.g., `pnpm db:generate && pnpm db:push` — one call, one process tree. This counts as 1 command.
- **Never run parallel terminal commands.** The `run_in_terminal` tool must be called sequentially.
- **Never use `isBackground: true`** for commands that will finish on their own (typecheck, test, lint, prisma generate). Only use background for intentionally persistent processes (which agents should NOT start anyway).

### Zero-process alternatives (USE THESE FIRST)
- **Type errors:** Use `get_errors` tool — queries VS Code language server in-process, zero Node processes. **NEVER run `pnpm typecheck`, `tsc`, or `pnpm build` just to find errors.**
- **File contents:** Use `read_file` / `grep_search` / `semantic_search` — never `cat`, `grep`, or `find` in terminal.
- **File existence:** Use `file_search` — never `ls`, `dir`, or `test -f` in terminal.
- **Linting:** Use `get_errors` — never `pnpm lint` from terminal.

### When terminal IS required
Only these operations genuinely need the terminal: `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate` (or `cd packages/backend && npx prisma migrate dev --name "..."` for named migrations), `pnpm test` (when user asks to run tests), `pnpm install`, installing packages.

### Process monitoring
- **After ANY terminal command,** run `tasklist | findstr /I node | wc -l` appended with `&&` to the same command. If count >8, run `taskkill /F /IM node.exe` and warn the user to restart their dev server.
- **Never use `find`** in Git Bash for counting — it resolves to Unix `find` (recursive file lister) instead of Windows `find.exe`, flooding the terminal with thousands of file paths.
- If your task needs no terminal at all, don't use it — this is the ideal case.

## Fast task map
- Auth/session bugs → `packages/frontend/src/app/providers/AuthProvider.tsx` + `packages/backend/src/platform/auth/`
- Brand scoping bugs → see `brand-scoping.instructions.md`
- API request shape/type issues → endpoint bindings live in `features/<bucket>/<feature>/api/`; shared client infra in `shared/api/client/`
- ContentBuilder work → `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/README.md`
- Data model/migration changes → `packages/backend/prisma/schema.prisma` + `pnpm db:generate`
- Backend architecture questions → see `backend-architecture.instructions.md`
- Deployment/environment/hosting questions → read `deployment.instructions.md` first (Render = backend, Vercel = frontend, Render Postgres = production DB)

## Architecture overview
- Monorepo: `packages/backend` (NestJS + Prisma + PostgreSQL), `packages/frontend` (Next.js 14 + React Query + MUI).
- Backend feature modules grouped under: `platform`, `catalog`, `workflow`, `content`, `finance`.
- Shared DB via `PrismaService` injected into services.
- Frontend code lives in `features/<bucket>/<feature>/` (domain) or `shared/` (cross-domain primitives). `src/lib/types/` is legacy-frozen — do not add to it. `src/lib/api.ts` has been deleted; all endpoint bindings now live in feature `api/` folders.
- Auth is JWT-based with refresh flow. Backend: `src/platform/auth/`. Frontend: `app/providers/AuthProvider.tsx` (migration to `features/platform/auth/` pending). Note: `BrandProvider` migration IS complete — actual code at `features/platform/brand/`, shim remains at `app/providers/BrandProvider.tsx`. Always import brand from `@/features/platform/brand`.

## Finding errors fast (never run `pnpm build` just to find errors)
- **Fastest (instant):** Use `get_errors` tool on a folder path — queries VS Code language server directly, no compile needed.
- **Frontend type errors:** `pnpm typecheck:frontend` — incremental `tsc --noEmit`, uses cache, much faster than build.
- **Backend type errors:** `pnpm typecheck:backend` — `tsc --noEmit` on NestJS source.
- **Both + lint in one shot:** `pnpm check` — typecheck + ESLint across both packages.
- **Scoped to one feature:** `pnpm typecheck:frontend 2>&1 | grep "src/features/<name>"` or pass the folder to `get_errors`.
- **Never** run `pnpm build` or `nest build` solely to find type errors — it's 10-30x slower for no benefit.
- **Never** run `pnpm typecheck`, `tsc`, or `pnpm build` just to find errors — use `get_errors` tool instead (zero Node processes spawned).

## Critical workflows
- Root commands: `pnpm dev` (both apps), `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format`, `pnpm check`.
- Backend DB workflow (from root): `pnpm db:generate`, `pnpm db:push`, `pnpm db:seed`, `pnpm db:migrate`.
- Auth token tooling: `tools/auth/get-token.js` (use `--frontend` for frontend paste instructions); tokens in `.auth/tokens`.
- Agent script execution: run one-off scripts directly. If the server must be stopped first, print a one-line warning then proceed.

## High-risk files (change carefully)
- `packages/frontend/src/app/providers/BrandProvider.tsx`
- `packages/frontend/src/app/providers/AuthProvider.tsx`
- `packages/backend/prisma/schema.prisma`

## Key reference files
- `packages/backend/prisma/schema.prisma` — data model
- `packages/backend/prisma/seeds/README.md` — seed data system (execution order, file inventory, adding new seeds)
- `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/README.md` — ContentBuilder component guide