/**
 * Removes all EventDay records except "Wedding Day" and cascades to related rows:
 *   - EventDayActivityMoment (via EventDayActivity)
 *   - EventDayActivity
 *   - EventDaySubjectRole
 *   - EventTypeDay
 *   - PackageEventDay
 *   - PackageDaySubject
 *   - PackageEventDayLocation
 *   - PackageLocationSlot
 *   - PackageSpaceSlot
 *   - FilmSceneSchedule
 *   - PackageFilmSceneSchedule
 *
 * Run from repo root:
 *   npx tsx packages/backend/scripts/remove-non-wedding-days.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DAYS_TO_REMOVE = [
  'Pre-Wedding Day',
  'Getting Ready',
  'Day After Session',
  'Engagement Session',
  'Rehearsal Dinner',
  'Welcome Party',
];

async function main() {
  const daysToDelete = await prisma.eventDay.findMany({
    where: { name: { in: DAYS_TO_REMOVE } },
    select: { id: true, name: true, brand_id: true },
  });

  if (daysToDelete.length === 0) {
    console.log('No non-Wedding Day event days found. Nothing to do.');
    return;
  }

  console.log(`Found ${daysToDelete.length} event days to remove:`);
  for (const d of daysToDelete) {
    console.log(`  - [${d.id}] ${d.name} (brand ${d.brand_id})`);
  }

  const dayIds = daysToDelete.map((d) => d.id);

  // Get activity IDs for cascade
  const activities = await prisma.eventDayActivity.findMany({
    where: { event_day_template_id: { in: dayIds } },
    select: { id: true },
  });
  const activityIds = activities.map((a) => a.id);

  await prisma.$transaction(async (tx) => {
    // 1. Delete activity moments
    if (activityIds.length > 0) {
      const r1 = await tx.eventDayActivityMoment.deleteMany({
        where: { event_day_activity_preset_id: { in: activityIds } },
      });
      console.log(`  Deleted ${r1.count} EventDayActivityMoment rows`);
    }

    // 2. Delete activities
    const r2 = await tx.eventDayActivity.deleteMany({
      where: { event_day_template_id: { in: dayIds } },
    });
    console.log(`  Deleted ${r2.count} EventDayActivity rows`);

    // 3. Delete subject roles for these days
    const r3 = await tx.eventDaySubjectRole.deleteMany({
      where: { event_day_id: { in: dayIds } },
    });
    console.log(`  Deleted ${r3.count} EventDaySubjectRole rows`);

    // 4. Delete event type day links
    const r4 = await tx.eventTypeDay.deleteMany({
      where: { event_day_template_id: { in: dayIds } },
    });
    console.log(`  Deleted ${r4.count} EventTypeDay rows`);

    // 5. Delete package-level references
    const r5 = await tx.packageDaySubject.deleteMany({
      where: { event_day_template_id: { in: dayIds } },
    });
    console.log(`  Deleted ${r5.count} PackageDaySubject rows`);

    const r6 = await tx.packageEventDayLocation.deleteMany({
      where: { event_day_template_id: { in: dayIds } },
    });
    console.log(`  Deleted ${r6.count} PackageEventDayLocation rows`);

    const r7 = await tx.packageLocationSlot.deleteMany({
      where: { event_day_template_id: { in: dayIds } },
    });
    console.log(`  Deleted ${r7.count} PackageLocationSlot rows`);

    const r8 = await tx.packageSpaceSlot.deleteMany({
      where: { event_day_template_id: { in: dayIds } },
    });
    console.log(`  Deleted ${r8.count} PackageSpaceSlot rows`);

    const r9 = await tx.packageEventDay.deleteMany({
      where: { event_day_template_id: { in: dayIds } },
    });
    console.log(`  Deleted ${r9.count} PackageEventDay rows`);

    // 6. Delete film scene schedules
    const r10 = await tx.filmSceneSchedule.deleteMany({
      where: { event_day_template_id: { in: dayIds } },
    });
    console.log(`  Deleted ${r10.count} FilmSceneSchedule rows`);

    const r11 = await tx.packageFilmSceneSchedule.deleteMany({
      where: { event_day_template_id: { in: dayIds } },
    });
    console.log(`  Deleted ${r11.count} PackageFilmSceneSchedule rows`);

    // 7. Delete the event days themselves
    const r12 = await tx.eventDay.deleteMany({
      where: { id: { in: dayIds } },
    });
    console.log(`  Deleted ${r12.count} EventDay rows`);

    // 8. Update remaining Wedding Day order_index to 0
    await tx.eventDay.updateMany({
      where: { name: 'Wedding Day' },
      data: { order_index: 0 },
    });
    console.log('  Updated Wedding Day order_index to 0');
  });

  console.log('\nDone! Only "Wedding Day" event days remain.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
