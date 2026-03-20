/**
 * Update Wedding Subject Roles
 *
 * Updates the existing role templates:
 * - Sets is_group: true on Bridesmaids, Groomsmen, Guest, Grandparents, Siblings
 * - Sets never_group: true on individual-only roles (Bride, Groom, Best Man, etc.)
 * - Renames "Guest" → "Guests"
 *
 * Safe to run multiple times (idempotent).
 *
 * Run: node scripts/update-wedding-subject-roles.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🎬 === Update Wedding Subject Roles ===\n');

  const allRoles = await prisma.subjectRoleTemplate.findMany({
    orderBy: [{ subject_type_id: 'asc' }, { order_index: 'asc' }],
    include: { subject_type: { select: { name: true } } },
  });

  console.log(`Found ${allRoles.length} role templates\n`);

  // ── 1. Roles that should be is_group: true ──────────────────────
  const groupRoleNames = ['Bridesmaids', 'Groomsmen', 'Guest', 'Guests', 'Grandparents', 'Siblings'];

  for (const role of allRoles) {
    if (groupRoleNames.includes(role.role_name) && !role.is_group) {
      await prisma.subjectRoleTemplate.update({
        where: { id: role.id },
        data: { is_group: true },
      });
      console.log(`  ✅ Set is_group on "${role.role_name}" (${role.subject_type.name})`);
    }
  }

  // ── 2. Roles that should be never_group: true ───────────────────
  const neverGroupRoleNames = [
    'Bride', 'Groom', 'Maid of Honor', 'Best Man',
    'Father of Bride', 'Mother of Bride',
    'Father of Groom', 'Mother of Groom',
    'Flower Girl', 'Ring Bearer',
    'Officiant', 'DJ / Band', 'Coordinator', 'Photographer',
    'VIP Guest',
  ];

  for (const role of allRoles) {
    if (neverGroupRoleNames.includes(role.role_name) && !role.never_group) {
      await prisma.subjectRoleTemplate.update({
        where: { id: role.id },
        data: { never_group: true },
      });
      console.log(`  ✅ Set never_group on "${role.role_name}" (${role.subject_type.name})`);
    }
  }

  // ── 3. Rename "Guest" → "Guests" ───────────────────────────────
  const guestRole = allRoles.find(r => r.role_name === 'Guest');
  if (guestRole) {
    await prisma.subjectRoleTemplate.update({
      where: { id: guestRole.id },
      data: { role_name: 'Guests', description: 'Wedding guests' },
    });
    console.log(`  ✅ Renamed "Guest" → "Guests"`);
  }

  // Also rename in existing subject records
  const guestPkgUpdated = await prisma.packageEventDaySubject.updateMany({
    where: { name: 'Guest' },
    data: { name: 'Guests' },
  });
  if (guestPkgUpdated.count > 0) {
    console.log(`  ✅ Renamed ${guestPkgUpdated.count} PackageEventDaySubject "Guest" → "Guests"`);
  }
  const guestProjUpdated = await prisma.projectEventDaySubject.updateMany({
    where: { name: 'Guest' },
    data: { name: 'Guests' },
  });
  if (guestProjUpdated.count > 0) {
    console.log(`  ✅ Renamed ${guestProjUpdated.count} ProjectEventDaySubject "Guest" → "Guests"`);
  }

  // ── 4. Set default count on existing group subjects that have no count ──
  const bridesmaidsRole = allRoles.find(r => r.role_name === 'Bridesmaids');
  const groomsmenRole = allRoles.find(r => r.role_name === 'Groomsmen');

  if (bridesmaidsRole) {
    const updated = await prisma.packageEventDaySubject.updateMany({
      where: { role_template_id: bridesmaidsRole.id, count: null },
      data: { count: 4 },
    });
    if (updated.count > 0) console.log(`  ✅ Set default count=4 on ${updated.count} Bridesmaids package subjects`);
  }
  if (groomsmenRole) {
    const updated = await prisma.packageEventDaySubject.updateMany({
      where: { role_template_id: groomsmenRole.id, count: null },
      data: { count: 4 },
    });
    if (updated.count > 0) console.log(`  ✅ Set default count=4 on ${updated.count} Groomsmen package subjects`);
  }

  // ── Summary ─────────────────────────────────────────────────────
  const finalRoles = await prisma.subjectRoleTemplate.findMany({
    orderBy: [{ subject_type_id: 'asc' }, { order_index: 'asc' }],
    include: { subject_type: { select: { name: true } } },
  });

  console.log('\n📋 Final roles:');
  for (const r of finalRoles) {
    const flags = [
      r.is_core ? '⭐core' : null,
      r.is_group ? '👥group' : null,
      r.never_group ? '🚫never_group' : null,
    ].filter(Boolean).join(' ');
    console.log(`  ${r.subject_type.name} | ${r.role_name} ${flags}`);
  }

  console.log('\n✅ Done!');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
