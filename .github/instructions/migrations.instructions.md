---
description: "Use when creating Prisma migrations, writing backfill scripts, running data migrations, or maintaining database schema changes."
---

# ProjectFlo — Migrations & Backfill Scripts

## Prisma migrations

### Workflow (from `packages/backend`)

1. Edit `prisma/schema.prisma`.
2. `npx prisma migrate dev --name "describe-changes"` — creates migration SQL + applies.
3. `npx prisma generate` — regenerate client.
4. Test, then commit the migration folder + updated schema together.

### Naming

- Migration name: lowercase, kebab-case, descriptive verb-noun.
- Good: `add-equipment-availability`, `rename-inquiry-status-field`, `create-film-subjects-table`.
- Bad: `update`, `fix`, `changes`, `migration1`.

### Rules

- Never hand-edit a migration SQL file after it has been applied to any shared database.
- One logical change per migration. Do not combine unrelated schema changes.
- Destructive changes (drop column, drop table) require a two-step migration: deprecate → remove in a later migration.

### Squashing migrations (baseline)

When reducing many migrations into one baseline (e.g. to clean up history):

1. Generate baseline SQL from current schema:
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_baseline/migration.sql
   ```
2. Clear local `_prisma_migrations` and mark baseline applied (does NOT touch the actual schema):
   ```bash
   node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$executeRawUnsafe('DELETE FROM _prisma_migrations').finally(()=>p.\$disconnect())"
   npx prisma migrate resolve --applied 0_baseline
   ```
3. Delete all old migration folders (keep only `0_baseline` and `migration_lock.toml`).
4. Verify locally: `npx prisma migrate status` → should show `1 migration found, Database schema is up to date`.
5. **Always** update `render.yaml` build command to prepend `prisma migrate resolve --applied 0_baseline || true` before `prisma migrate deploy` so Render's existing DB is handled automatically on next deploy:
   ```
   ... && pnpm exec prisma migrate resolve --applied 0_baseline || true && pnpm exec prisma migrate deploy && ...
   ```
   The `|| true` makes it permanently safe — subsequent deploys silently skip it.

## Backfill scripts

Located in `packages/backend/scripts/`. Run manually via `node scripts/<name>.js` from the backend directory.

### Naming conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `backfill-*` | Fill missing data after schema change | `backfill-task-due-dates.js` |
| `migrate-*` | Transform existing data to new shape | `migrate-inquiry-statuses-qualified.js` |
| `seed-*` | Create reference/lookup data | `seed-montage-system.js` |
| `check-*` | Read-only validation / audit | `check-task-integrity.js` |
| `cleanup-*` | Remove orphaned or stale data | `cleanup-orphaned-tasks.js` |
| `update-*` | Bulk update existing records | `update-payment-brackets.js` |

### Idempotency

All scripts **must** be safe to run multiple times:

- Use `upsert()` instead of `create()` when possible.
- Use `findUnique()` → conditional update to skip already-processed rows.
- Guard with `if (existing) return;` at the record level.
- Log the count of skipped vs. processed records.

### Script template

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.feature.findMany({ where: { /* needs backfill */ } });
  console.log(`Found ${records.length} records to process`);

  let processed = 0, skipped = 0;
  for (const record of records) {
    // idempotency check
    if (record.alreadyMigrated) { skipped++; continue; }
    await prisma.feature.update({ where: { id: record.id }, data: { /* ... */ } });
    processed++;
  }
  console.log(`Done. Processed: ${processed}, Skipped: ${skipped}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

### Safety

- Always test on a local database first.
- For destructive scripts (`cleanup-*`, `delete-*`): add a dry-run mode that logs what would be deleted without executing.
- Backfill scripts should not depend on the NestJS application context — use raw PrismaClient.
