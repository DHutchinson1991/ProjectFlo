---
description: "Audit a feature or backend module against all ProjectFlo instruction rules. Finds violations in architecture, conventions, patterns, and coding standards, then fixes them."
---

# Enforce Rules

Audit a frontend feature or backend module against all ProjectFlo instruction rules and fix every violation found.

## Input

The user will specify a target, e.g.:
- `features/catalog/packages` — audit a frontend feature
- `catalog/service-packages` — audit a backend module
- `all frontend` or `all backend` — audit everything (one bucket at a time)

## Process

### 1. Load rules (mandatory — before any audit)

Read these instruction files before auditing:

**Frontend targets:**
- `.github/instructions/frontend-architecture.instructions.md`
- `.github/instructions/frontend-conventions.instructions.md`
- `.github/instructions/react-query.instructions.md`
- `.github/instructions/brand-scoping.instructions.md`
- `.github/instructions/frontend-design-system.instructions.md`
- `.github/instructions/feature-readmes.instructions.md`

**Backend targets:**
- `.github/instructions/backend-architecture.instructions.md`
- `.github/instructions/api-design.instructions.md`
- `.github/instructions/validation.instructions.md`
- `.github/instructions/database-design.instructions.md`
- `.github/instructions/error-handling.instructions.md`
- `.github/instructions/feature-readmes.instructions.md`

### 2. Audit (read-only — no edits)

For each file in the target feature/module, check against every applicable rule category below.

#### Frontend checks

**Architecture violations:**
- [ ] Files in frozen folders (`src/lib/types/`, `src/types/`, `src/components/`, `src/hooks/`)
- [ ] Domain code in `app/` route files instead of `features/`
- [ ] Feature code placed in wrong bucket
- [ ] Missing or incorrect barrel exports (`index.ts`)
- [ ] Feature folder missing required structure (`api/`, `hooks/`, `types/`, `components/`)

**API convention violations:**
- [ ] Raw `fetch()` calls instead of shared API client
- [ ] API file missing `createXApi(client)` factory pattern
- [ ] API file importing from `shared/types/api-client.types` instead of `@/shared/api/client`
- [ ] Untyped responses (`any`, `Promise<any>`, `Record<string, unknown>`)
- [ ] Duplicate API methods for the same endpoint
- [ ] Direct API calls in components instead of through hooks

**React Query violations:**
- [ ] `useEffect` + `useState` for server data fetching (BANNED)
- [ ] `useQuery`/`useMutation` called directly in components instead of hook files
- [ ] Missing query key factory (`queryKeys.ts`)
- [ ] Query keys missing `brandId` scope
- [ ] No-op passthrough hooks (`useXApi = () => xApi`)
- [ ] Components doing `await api...; setState(); reload()` instead of using mutations

**Brand scoping violations:**
- [ ] Importing brand from `@/app/providers/BrandProvider` instead of `@/features/platform/brand`
- [ ] Missing `X-Brand-Context` on tenant-scoped requests
- [ ] Manual `brandId` query params instead of header-based brand context

**README violations:**
- [ ] Missing README.md
- [ ] README missing required sections (What this module does, Key files, Business rules, Related modules)
- [ ] README out of date with actual files

#### Backend checks

**Architecture violations:**
- [ ] Module placed in wrong bucket
- [ ] File naming not kebab-case
- [ ] Multiple DTO classes in one file
- [ ] Vague file names (`utils.ts`, `helpers.ts`, `common.ts`)
- [ ] Missing module/controller/service pattern

**Size limit violations:**
- [ ] Service >250 lines
- [ ] Controller >200 lines
- [ ] DTO >120 lines
- [ ] Method >60 lines

**Service violations:**
- [ ] Service mixing CRUD + relationship assignment + mapping + admin logic
- [ ] Direct DB access outside of services (bypassing PrismaService)
- [ ] `any` type in services, controllers, or mappers

**API design violations:**
- [ ] Controller doing business logic instead of delegating to service
- [ ] Missing validation decorators on DTO fields
- [ ] Missing brand context extraction in tenant-scoped endpoints

**README violations:**
- [ ] Missing README.md
- [ ] README missing required sections
- [ ] README out of date

### 3. Report

Produce a **violations report** grouped by severity:

```markdown
Rules audit — <target>

🔴 Critical (must fix):
- [file:line] — [rule violated] — [what's wrong]

🟡 Warning (should fix):
- [file:line] — [rule violated] — [what's wrong]

📋 Summary:
- Critical: X violations
- Warning: X violations
- Files scanned: X
- Clean files: X
```

Present this report to the user and wait for approval before fixing.

### 4. Fix (after approval)

1. Work through violations using the todo list, starting with critical.
2. For each fix:
   - Make the minimal change to bring the code into compliance.
   - Do NOT refactor beyond what the rule requires.
   - Update imports across the codebase if files moved.
3. After all fixes, run `get_errors` on the affected directories.
4. Update the feature README if key files changed.

## Rules

- **Audit before fixing** — never start editing without presenting the violations report first.
- **Minimal fixes only** — fix the violation, don't redesign the feature. If a fix requires >50 lines of change, flag it for the user as a separate refactor task.
- **One violation = one fix** — don't bundle unrelated fixes into compound edits.
- **Verify with grep before moving/deleting** — confirm no consumers will break.
- Follow terminal budget: max 3 commands. Use `get_errors` for validation.
- If the audit finds zero violations, say so and stop.
