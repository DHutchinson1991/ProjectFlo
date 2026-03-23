---
description: "Use when creating, editing, or running seed files, or when adding new reference/test data to the database."
applyTo: "packages/backend/prisma/seeds/**"
---

# ProjectFlo — Seed Data Conventions

## Before you start

1. **Read `packages/backend/prisma/seeds/README.md`** — the full seed system reference.
2. **Read `packages/backend/prisma/utils/README.md`** — the authoring guide with template and utilities.

## One location for all seeds

Prefer `packages/backend/prisma/seeds/` for new seed files. No new standalone seed scripts should be added at the backend root or in `scripts/`. Existing legacy root-level `seed-*.js` files are kept only until they are migrated.

## File organisation

Seeds are grouped into **four layers**, executed in this order:

| Layer | Prefix / pattern | Scope | Examples |
|-------|-----------------|-------|---------|
| **System** | `admin-*`, `system-*` | No brand, global infrastructure | `admin-system-seed.ts`, `system-montage.seed.ts` |
| **Brand content** | `<brand>-*.seed.ts` | Brand-scoped templates, presets, lookup data | `moonrise-subject-templates.seed.ts`, `moonrise-scene-templates.seed.ts` |
| **Brand setup** | `<brand>-<area>-setup.ts` | Per-brand entities (team, equipment, etc.) | `moonrise-team-setup.ts`, `layer5-brand-setup.ts` |
| **Brand orchestrator** | `<brand>-complete-setup.ts` | Calls sub-seeds for one brand | `moonrise-complete-setup.ts` |

- **Order lives in orchestrators**, not filenames. Keep brand-specific seeds under the brand orchestrator and system seeds under the root orchestrator. Prefer descriptive filenames over numeric prefixes.
- **Root orchestrator** (`index.ts`) calls: system → brand orchestrators → final metrics.
- When adding a new seed, register it in the correct orchestrator — not directly in `index.ts` unless it's a system/global seed.

## Contract

Every seed file must:

1. **Export a default async function** returning `SeedSummary { created, updated, skipped, total }`.
2. **Be idempotent** — safe to run repeatedly without duplicating data. Use `upsert()` or `findFirst` + conditional create.
3. **Use `console.log`** for simple progress output. Format: `[SeedName] Created: X, Skipped: Y`.
4. **Not print global summaries** — the root orchestrator handles final metrics.

## Logging

Keep it simple:

```ts
console.log(`[SubjectTemplates] Created: ${created}, Skipped: ${skipped}`);
```

The existing `SeedLogger` and `createSeedLogger()` utilities in `packages/backend/prisma/utils/seed-logger.ts` are available if you need richer output, but plain `console.log` with the `[SeedName]` prefix is sufficient for new seeds.

## Idempotency patterns

```ts
// Pattern 1: upsert (preferred for entities with unique constraints)
await prisma.roles.upsert({
  where: { name: 'Director' },
  update: { /* fields */ },
  create: { /* fields */ },
});

// Pattern 2: findFirst + conditional create (when no unique constraint)
const existing = await prisma.feature.findFirst({ where: { name: item.name, brand_id: brand.id } });
if (!existing) {
  await prisma.feature.create({ data: { ...item, brand_id: brand.id } });
  created++;
} else {
  skipped++;
}
```

## Keep docs up to date

When adding or changing seed files, update **in the same commit**:
- `packages/backend/prisma/seeds/README.md` — execution order table, file inventory, any new layer/group.
- `packages/backend/prisma/utils/README.md` — if the authoring pattern or utilities change.

## Running

```bash
cd packages/backend
npx prisma db seed                         # Run all seeds
SEED_DEMO_DATA=true npx prisma db seed     # Include demo data
npx prisma db push --force-reset && npx prisma db seed  # Full reset + reseed
```
