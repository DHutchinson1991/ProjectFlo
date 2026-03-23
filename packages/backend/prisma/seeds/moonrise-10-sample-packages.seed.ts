/**
 * Moonrise 10 - Sample Packages from Wedding Types
 *
 * Creates one demo service package for each wedding type, with FULL linkages:
 *  - PackageEventDay
 *  - PackageActivity (with start_time calculated from template offsets)
 *  - PackageActivityMoment
 *  - PackageEventDaySubject (from wedding type subjects)
 *  - PackageLocationSlot (from wedding type locations, 1-5)
 *  - SubjectActivityAssignment (activity ↔ subject junction)
 *  - LocationActivityAssignment (activity ↔ location slot junction)
 *
 * This mirrors the EventSubtypesService.createPackageFromTemplate() logic so
 * seed data and UI-created packages share the same structure.
 */

import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

/** HH:MM string helper */
function calculateTimeFromOffset(eventStartTime: string, offsetMinutes: number): string {
  const [h, m] = eventStartTime.split(':').map(Number);
  const totalMin = h * 60 + m + offsetMinutes;
  const hours = Math.floor(totalMin / 60) % 24;
  const mins = totalMin % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

async function seedSamplePackages(): Promise<SeedSummary> {
  logger.sectionHeader('Sample Packages', 'Creating demo packages from wedding types with activity-subject-location links');
  logger.startTimer('sample-packages');

  let created = 0;
  let skipped = 0;

  // Find Moonrise Films brand
  const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
  if (!brand) {
    logger.warning('Moonrise Films brand not found, skipping sample packages.');
    return { created: 0, updated: 0, skipped: 0, total: 0 };
  }

  // Get all system-seeded wedding types with full relations
  const weddingTypes = await prisma.eventSubtype.findMany({
    where: { is_system_seeded: true, is_active: true },
    include: {
      activities: {
        orderBy: { order_index: 'asc' },
        include: {
          moments: { orderBy: { order_index: 'asc' } },
          activity_locations: { include: { wedding_type_location: true } },
          activity_subjects: { include: { wedding_type_subject: true } },
        },
      },
      locations: { orderBy: { order_index: 'asc' } },
      subjects: { orderBy: { order_index: 'asc' } },
    },
    orderBy: { order_index: 'asc' },
  });

  if (weddingTypes.length === 0) {
    logger.warning('No wedding types found. Run moonrise-09-wedding-types seed first.');
    return { created: 0, updated: 0, skipped: 0, total: 0 };
  }

  // Get or create "Wedding Day" event day template
  let weddingDayTemplate = await prisma.eventDay.findFirst({
    where: { brand_id: brand.id, name: 'Wedding Day' },
  });
  if (!weddingDayTemplate) {
    weddingDayTemplate = await prisma.eventDay.create({
      data: {
        brand_id: brand.id,
        name: 'Wedding Day',
        description: 'Main wedding day event',
        order_index: 1,
        is_active: true,
      },
    });
  }

  for (const wt of weddingTypes) {
    const packageName = `${wt.name} – Sample Package`;

    // Skip if sample package already exists for this wedding type
    const existing = await prisma.service_packages.findFirst({
      where: { brand_id: brand.id, wedding_type_id: wt.id, name: packageName },
    });
    if (existing) {
      skipped++;
      logger.skipped(`"${packageName}"`, 'already exists');
      continue;
    }

    // ── 1. Create service package ──
    const pkg = await prisma.service_packages.create({
      data: {
        brand_id: brand.id,
        wedding_type_id: wt.id,
        name: packageName,
        description: wt.description,
        category: 'Wedding',
        is_active: true,
      },
    });

    // ── 2. Link package → event day ──
    const pkgEventDay = await prisma.packageEventDay.create({
      data: {
        package_id: pkg.id,
        event_day_template_id: weddingDayTemplate.id,
        order_index: 1,
      },
    });

    // ── 3. Create PackageEventDaySubjects ──
    const subjectMap = new Map<number, number>(); // EventSubtypeSubject.id → PackageEventDaySubject.id
    for (const subject of wt.subjects) {
      const pkgSubject = await prisma.packageDaySubject.create({
        data: {
          package_id: pkg.id,
          event_day_template_id: weddingDayTemplate.id,
          name: subject.name,
          category: 'PEOPLE',
          order_index: subject.order_index,
          notes: `Auto-populated from ${wt.name} template`,
        },
      });
      subjectMap.set(subject.id, pkgSubject.id);
    }

    // ── 4. Create PackageLocationSlots (max 5) ──
    const locationSlotMap = new Map<number, number>(); // EventSubtypeLocation.id → PackageLocationSlot.id
    for (let i = 0; i < wt.locations.length && i < 5; i++) {
      const slot = await prisma.packageLocationSlot.create({
        data: {
          package_id: pkg.id,
          event_day_template_id: weddingDayTemplate.id,
          location_number: i + 1,
        },
      });
      locationSlotMap.set(wt.locations[i].id, slot.id);
    }

    // ── 5. Create PackageActivities with moments + junction records ──
    let activityCount = 0;
    let momentCount = 0;
    let subjectAssignments = 0;
    let locationAssignments = 0;

    for (const activity of wt.activities) {
      const startTime = calculateTimeFromOffset(
        wt.event_start_time,
        activity.start_time_offset_minutes,
      );

      const pkgActivity = await prisma.packageActivity.create({
        data: {
          package_id: pkg.id,
          package_event_day_id: pkgEventDay.id,
          name: activity.name,
          description: activity.description,
          color: activity.color,
          icon: activity.icon,
          start_time: startTime,
          duration_minutes: activity.duration_minutes,
          order_index: activity.order_index,
        },
      });
      activityCount++;

      // ── 5a. Moments ──
      for (const moment of activity.moments) {
        await prisma.packageActivityMoment.create({
          data: {
            package_activity_id: pkgActivity.id,
            name: moment.name,
            order_index: moment.order_index,
            duration_seconds: moment.duration_seconds,
            is_required: moment.is_key_moment,
            notes: `Auto-populated from ${wt.name} template`,
          },
        });
        momentCount++;
      }

      // ── 5b. Subject ↔ Activity assignments ──
      for (const actSubj of activity.activity_subjects) {
        const pkgSubjectId = subjectMap.get(actSubj.wedding_type_subject_id);
        if (pkgSubjectId) {
          await prisma.packageDaySubjectActivity.create({
            data: {
              package_day_subject_id: pkgSubjectId,
              package_activity_id: pkgActivity.id,
            },
          });
          subjectAssignments++;
        }
      }

      // ── 5c. Location ↔ Activity assignments ──
      for (const actLoc of activity.activity_locations) {
        const slotId = locationSlotMap.get(actLoc.wedding_type_location_id);
        if (slotId) {
          await prisma.locationActivityAssignment.create({
            data: {
              package_location_slot_id: slotId,
              package_activity_id: pkgActivity.id,
            },
          });
          locationAssignments++;
        }
      }
    }

    created++;
    logger.created(
      `"${packageName}" (${activityCount} activities, ${momentCount} moments, ${subjectAssignments} subject-links, ${locationAssignments} location-links)`,
    );
  }

  const total = created + skipped;
  logger.summary('Sample packages', { created, updated: 0, skipped, total });
  logger.endTimer('sample-packages', 'Sample packages seeding');
  return { created, updated: 0, skipped, total };
}

export default seedSamplePackages;

if (require.main === module) {
  seedSamplePackages()
    .catch((error) => {
      console.error('❌ Error seeding sample packages:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
