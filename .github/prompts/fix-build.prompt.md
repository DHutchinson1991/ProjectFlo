---
description: "Fix all TypeScript/build errors in ProjectFlo systematically — triage root causes first, fix in batches, rebuild to verify. Run this and walk away."
name: "Fix Build Errors"
agent: "agent"
---

# Fix All Build Errors — Systematic Triage Approach

You are fixing a broken build in ProjectFlo (NestJS + Prisma backend, Next.js frontend).
Do NOT fix errors one-by-one. Follow this exact workflow from start to finish without stopping.

---

## PHASE 1 — Capture the Full Error Picture

1. Run the backend build and capture ALL errors:
   ```
   cd "c:\Users\works\Documents\Code Projects\ProjectFlo\packages\backend"
   npm run build 2>&1
   ```

2. Run the frontend build and capture ALL errors:
   ```
   cd "c:\Users\works\Documents\Code Projects\ProjectFlo\packages\frontend"
   npm run build 2>&1
   ```

3. Use the `get_errors` tool to read all TypeScript diagnostics from the IDE as a cross-check.

4. **Count and list errors per file.** Identify the top 5–10 files with the most errors — these are your highest-priority targets.

5. Record a baseline error count before touching any code: `Backend: X errors | Frontend: Y errors`

---

## PHASE 2 — Triage Root Causes (DO THIS BEFORE touching any code)

Group ALL errors into these categories and work them in priority order:

| Priority | Category | Examples |
|----------|----------|---------|
| 🔴 P1 | Prisma client out of sync | `Property X does not exist on type PrismaClient` |
| 🔴 P1 | Missing or renamed module/export | `Module not found`, `has no exported member` |
| 🔴 P1 | Changed shared type/interface | Same error in many files all referencing the same type |
| 🟡 P2 | Type mismatch on a specific interface | `Type X is not assignable to type Y` in one domain |
| 🟢 P3 | Individual component/file errors | Isolated, not repeated across many files |
| ⚪ P4 | Implicit `any`, unused variables | Minor linting issues — skip unless blocking build |

**Identify cascade errors**: errors where fixing ONE root file will clear many downstream errors.
Do not fix downstream errors first — always fix the source.

---

## PHASE 3 — Fix in Root-Cause Order

### Step 3a — Prisma First (always check this before touching any code)

If there are ANY Prisma-related type errors, run this before editing any TypeScript:
```
cd "c:\Users\works\Documents\Code Projects\ProjectFlo\packages\backend"
npx prisma generate
```
Re-run `npm run build` and record the new error count. If errors dropped significantly, continue.

### Step 3b — Fix P1 Root Causes

- Read the source file causing the cascade
- Understand the original intent before changing it
- Fix the source (the renamed export, broken module, missing type)
- Do NOT touch all the importing files — they will resolve automatically once the source is fixed
- Reference files with business logic you're unsure about:
  - Pricing: `PRICING_TOTALS_REFERENCE.md`
  - Timeline save: `SCENE_SAVE_DATA_FLOW.md`
  - API shape: `packages/frontend/src/lib/api.ts` and `packages/frontend/src/lib/types/`
  - Auth: `packages/backend/src/core/auth/`
  - Brand scoping: `packages/frontend/src/app/providers/BrandProvider.tsx`

### Step 3c — Fix P2 Type Mismatches

Work through type mismatches grouped by domain (e.g. all pricing errors together, all auth errors together).
Read the full relevant service/type files before changing anything — understand the intended shape first.

### Step 3d — Fix P3 Individual Errors

Fix remaining isolated errors file by file. Batch edits to the same file using multi-replace.

### Step 3e — Skip P4

Do not touch implicit `any` or unused variable warnings unless they are causing a hard build failure.

---

## PHASE 4 — Verification Loop

After each batch of fixes:
1. Re-run the build for the affected package
2. Record the new error count
3. If count dropped — continue to next batch
4. If count did NOT change or increased — stop, read the new errors carefully, identify what changed

Final verification — both builds must pass before you are done:
```
cd "c:\Users\works\Documents\Code Projects\ProjectFlo"
pnpm build
```

---

## PHASE 5 — Guard Rails (must follow throughout)

- **Never** start `pnpm dev` or any long-running server as part of this fix
- **Never** delete a type, interface, or export without checking all its usages first
- **Never** cast to `any` to silence a type error — fix the real type
- **Never** run `prisma migrate dev` — if a schema change is needed, stop and flag it clearly for the user
- **Never** modify `packages/backend/prisma/schema.prisma` without flagging it as requiring human review
- High-risk files to change carefully (read thoroughly before editing):
  - `packages/frontend/src/lib/api.ts`
  - `packages/frontend/src/app/providers/BrandProvider.tsx`
  - `packages/frontend/src/app/providers/AuthProvider.tsx`
  - `packages/backend/prisma/schema.prisma`

---

## DONE WHEN

Both of these commands exit with zero errors:
```
cd packages/backend && npm run build    # ✅ 0 errors
cd packages/frontend && npm run build   # ✅ 0 errors
```

Finish with a summary report:
- Baseline error count (backend + frontend)
- Root causes found and resolved
- Files changed and why
- Any issues that need human input (schema changes, unclear business logic, ambiguous type changes)
- Final error count
