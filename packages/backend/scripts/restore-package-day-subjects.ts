/**
 * Restore PackageDaySubjects for all Moonrise packages.
 * The earlier cleanup script deleted them; seeds use skipDuplicates so won't recreate.
 *
 * Usage: cd packages/backend && npx tsx scripts/restore-package-day-subjects.ts
 */
import { PrismaClient } from '@prisma/client';

const WEDDING_ROLES = [
  'Bride', 'Groom', 'Best Man', 'Maid of Honor',
  'Father of Bride', 'Mother of Bride', 'Father of Groom', 'Mother of Groom',
  'Bridesmaids', 'Groomsmen', 'Flower Girl', 'Ring Bearer',
  'Guests', 'Officiant',
];

async function main() {
  const prisma = new PrismaClient();
  try {
    const brand = await prisma.brands.findFirst({
      where: { name: { contains: 'Moonrise', mode: 'insensitive' } },
    });
    if (!brand) throw new Error('Moonrise brand not found');

    // Get subject roles
    const roles = await prisma.subjectRole.findMany({
      where: { brand_id: brand.id, role_name: { in: WEDDING_ROLES } },
      orderBy: { order_index: 'asc' },
    });
    console.log(`Found ${roles.length} subject roles`);

    // Get all packages with their event days and existing day subjects
    const packages = await prisma.service_packages.findMany({
      where: { brand_id: brand.id },
      include: {
        package_event_days: { include: { event_day: { select: { id: true, name: true } } } },
        package_day_subjects: { include: { role_template: true } },
      },
    });

    for (const pkg of packages) {
      // Find the wedding event day for this package
      const weddingPed = pkg.package_event_days.find(
        (ped) => ped.event_day?.name?.toLowerCase().includes('wedding'),
      );
      if (!weddingPed) {
        console.log(`Package "${pkg.name}" (id=${pkg.id}): no wedding event day, skipping`);
        continue;
      }

      const eventDayId = weddingPed.event_day_template_id;
      const existingRoles = new Set(
        pkg.package_day_subjects
          .filter((s) => s.event_day_template_id === eventDayId)
          .map((s) => s.role_template_id),
      );

      console.log(`\nPackage "${pkg.name}" (id=${pkg.id}), event day id=${eventDayId}`);
      console.log(`  Existing: ${pkg.package_day_subjects.filter(s => s.event_day_template_id === eventDayId).map(s => s.name).join(', ') || '(none)'}`);

      let created = 0;
      for (const role of roles) {
        if (existingRoles.has(role.id)) continue;
        await prisma.packageDaySubject.create({
          data: {
            package_id: pkg.id,
            event_day_template_id: eventDayId,
            name: role.role_name,
            role_template_id: role.id,
            order_index: role.order_index,
            count: role.is_group ? 4 : undefined,
          },
        });
        created++;
        console.log(`  + Created: "${role.role_name}"`);
      }

      if (created === 0) {
        console.log('  All subjects already present');
      }
    }

    // Now restore SpaceSlotSubjectPositions for packages that have space slots
    console.log('\n--- Restoring SpaceSlotSubjectPositions ---');
    const spaceSlots = await prisma.packageSpaceSlot.findMany({
      where: { package: { brand_id: brand.id } },
      include: {
        subject_positions: true,
        package: {
          include: {
            package_day_subjects: {
              include: { role_template: true },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    for (const slot of spaceSlots) {
      const existingDaySubjectIds = new Set(slot.subject_positions.map((sp) => sp.day_subject_id));
      const daySubjects = (slot as any).package.package_day_subjects;

      let created = 0;
      for (let i = 0; i < daySubjects.length; i++) {
        const ds = daySubjects[i];
        if (existingDaySubjectIds.has(ds.id)) continue;

        // Place subjects in a grid pattern for initial positioning
        const col = i % 4;
        const row = Math.floor(i / 4);
        await prisma.spaceSlotSubjectPosition.create({
          data: {
            space_slot: { connect: { id: slot.id } },
            day_subject: { connect: { id: ds.id } },
            label: ds.name,
            x: 150 + col * 60,
            y: 100 + row * 50,
            rotation: 0,
          },
        });
        created++;
      }

      if (created > 0) {
        console.log(`  SpaceSlot ${slot.id} (pkg ${slot.package_id}): created ${created} subject positions`);
      }
    }

    console.log('\n✅ PackageDaySubjects and positions restored. Refresh the page.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
