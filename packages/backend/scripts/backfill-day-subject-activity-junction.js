/**
 * Pre-Migration: Backfill Subject Activity Junction Records
 *
 * Run BEFORE `npx prisma migrate dev` (while the old schema is still live).
 *
 * For any PackageEventDaySubject rows that have a direct `package_activity_id`
 * FK (Change 3 removes this column), this script ensures the corresponding
 * `subject_activity_assignments` junction row already exists before the column is dropped.
 *
 * Same for ProjectEventDaySubject → ProjectSubjectActivityAssignment.
 *
 * Safe to run multiple times (idempotent).
 *
 * ⚠️  Stop the backend server before running this script.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 === Backfill Subject Activity Junction Records ===\n');

  // ── Package subjects with direct activity FK ────────────────────────────────
  console.log('Step 1: Backfilling subject_activity_assignments...');

  const pkgSubjects = await prisma.$queryRawUnsafe(`
    SELECT id, package_activity_id
    FROM package_event_day_subjects
    WHERE package_activity_id IS NOT NULL
  `);
  console.log(`  Found ${pkgSubjects.length} package subjects with direct package_activity_id`);

  let pkgCreated = 0;
  let pkgSkipped = 0;
  for (const row of pkgSubjects) {
    const existing = await prisma.$queryRawUnsafe(`
      SELECT id FROM subject_activity_assignments
      WHERE package_event_day_subject_id = ${row.id}
        AND package_activity_id = ${row.package_activity_id}
      LIMIT 1
    `);
    if (existing.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO subject_activity_assignments (package_event_day_subject_id, package_activity_id)
        VALUES (${row.id}, ${row.package_activity_id})
      `);
      pkgCreated++;
    } else {
      pkgSkipped++;
    }
  }
  console.log(`  ✅ Created: ${pkgCreated}, Skipped (already existed): ${pkgSkipped}`);

  // ── Project subjects with direct activity FK ────────────────────────────────
  console.log('\nStep 2: Backfilling project_subject_activity_assignments...');

  const projSubjects = await prisma.$queryRawUnsafe(`
    SELECT id, project_activity_id
    FROM project_event_day_subjects
    WHERE project_activity_id IS NOT NULL
  `);
  console.log(`  Found ${projSubjects.length} project subjects with direct project_activity_id`);

  let projCreated = 0;
  let projSkipped = 0;
  for (const row of projSubjects) {
    const existing = await prisma.$queryRawUnsafe(`
      SELECT id FROM project_subject_activity_assignments
      WHERE project_event_day_subject_id = ${row.id}
        AND project_activity_id = ${row.project_activity_id}
      LIMIT 1
    `);
    if (existing.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO project_subject_activity_assignments (project_event_day_subject_id, project_activity_id)
        VALUES (${row.id}, ${row.project_activity_id})
      `);
      projCreated++;
    } else {
      projSkipped++;
    }
  }
  console.log(`  ✅ Created: ${projCreated}, Skipped (already existed): ${projSkipped}`);

  console.log('\n✅ Done!\n');
  console.log('Next step: npx prisma migrate dev --name subjects_system_refactor');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
