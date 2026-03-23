/**
 * Pre-Migration: Subjects System Refactor — Data Preparation
 *
 * Run this script BEFORE `npx prisma migrate dev` (before the SQL migration).
 * It works against the OLD schema using raw SQL.
 *
 * What it does:
 *   1. Adds `brand_id` to `subject_role_templates` (populated from `subject_type_templates`)
 *   2. Adds `subject_role_id` to `event_type_subject_types` (NULL for old type-level rows)
 *   3. For each old EventTypeSubject row (event_type_id → SubjectType), inserts one new row
 *      per SubjectRole in that SubjectType into `event_type_subject_types.subject_role_id`
 *   4. Removes old type-level EventTypeSubject rows (where subject_role_id IS NULL)
 *
 * After this script, run:
 *   node scripts/backfill-day-subject-activity-junction.js
 * Then:
 *   npx prisma migrate dev --name subjects_system_refactor
 *
 * ⚠️  Stop the backend server before running this script.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 === Pre-Migration: Subjects System Refactor ===\n');

  // ── Step 1: Add brand_id to subject_role_templates ─────────────────────────
  console.log('Step 1: Adding brand_id to subject_role_templates...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE subject_role_templates
    ADD COLUMN IF NOT EXISTS brand_id INTEGER
  `);

  const populated = await prisma.$executeRawUnsafe(`
    UPDATE subject_role_templates srt
    SET brand_id = stt.brand_id
    FROM subject_type_templates stt
    WHERE srt.subject_type_id = stt.id
      AND srt.brand_id IS NULL
  `);
  console.log(`  ✅ Populated brand_id on ${populated} subject_role_templates rows`);

  const missing = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) AS count FROM subject_role_templates WHERE brand_id IS NULL
  `);
  if (Number(missing[0].count) > 0) {
    console.warn(`  ⚠️  ${missing[0].count} subject_role_templates rows still have NULL brand_id`);
  }

  // ── Step 2: Expand EventTypeSubject rows: type-level → role-level ───────────
  console.log('\nStep 2: Expanding event_type_subject_types to role-level rows...');

  // Add subject_role_id column (will hold SubjectRole ID for new rows)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE event_type_subject_types
    ADD COLUMN IF NOT EXISTS subject_role_id INTEGER
  `);

  // Mark existing rows (these are type-level, will be deleted after expansion)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE event_type_subject_types
    ADD COLUMN IF NOT EXISTS _migration_old BOOLEAN DEFAULT FALSE
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE event_type_subject_types SET _migration_old = TRUE WHERE subject_role_id IS NULL
  `);

  // Insert new role-level rows: one per SubjectRole per EventTypeSubject
  const inserted = await prisma.$executeRawUnsafe(`
    INSERT INTO event_type_subject_types (event_type_id, subject_type_template_id, subject_role_id, order_index, is_default, created_at, updated_at, _migration_old)
    SELECT
      ets.event_type_id,
      ets.subject_type_template_id,
      srt.id AS subject_role_id,
      (ets.order_index * 1000 + srt.order_index) AS order_index,
      ets.is_default,
      NOW(),
      NOW(),
      FALSE
    FROM event_type_subject_types ets
    JOIN subject_role_templates srt ON srt.subject_type_id = ets.subject_type_template_id
    WHERE ets._migration_old = TRUE
    ON CONFLICT DO NOTHING
  `);
  console.log(`  ✅ Inserted ${inserted} new role-level EventTypeSubject rows`);

  // Delete old type-level rows
  const deleted = await prisma.$executeRawUnsafe(`
    DELETE FROM event_type_subject_types WHERE _migration_old = TRUE
  `);
  console.log(`  ✅ Deleted ${deleted} old type-level EventTypeSubject rows`);

  // Clean up the migration flag column
  await prisma.$executeRawUnsafe(`
    ALTER TABLE event_type_subject_types DROP COLUMN IF EXISTS _migration_old
  `);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const roleCount = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) AS count FROM subject_role_templates WHERE brand_id IS NOT NULL
  `);
  const etsCount = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) AS count FROM event_type_subject_types WHERE subject_role_id IS NOT NULL
  `);

  console.log(`\n📋 Summary:`);
  console.log(`  subject_role_templates with brand_id: ${roleCount[0].count}`);
  console.log(`  event_type_subject_types with subject_role_id: ${etsCount[0].count}`);
  console.log('\n✅ Done!\n');
  console.log('Next steps:');
  console.log('  1. node scripts/backfill-day-subject-activity-junction.js');
  console.log('  2. npx prisma migrate dev --name subjects_system_refactor');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
