/**
 * Moonrise Catalog – Packages
 *
 * Consolidated seed that creates all service packages:
 *   1. Film templates (Film records) shared across packages
 *   2. 4 real Moonrise wedding packages (Starter, Essentials, Highlights, Film)
 *   3. The Birthday Package
 *
 * Pricing is NOT hardcoded — it comes from crew rates, equipment, and tasks.
 *
 * Prerequisites:
 *   - moonrise-catalog-services (wedding types + birthday EventType)
 *   - moonrise-catalog-event-templates (event days)
 *   - global-job-roles (videographer role)
 */

import { PrismaClient, FilmType } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType, sumSummaries } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

// ═══════════════════════════════════════════════════════════════════════
// Film template definitions (shared across wedding packages)
// ═══════════════════════════════════════════════════════════════════════

interface FilmDef {
  name: string;
  film_type: FilmType;
  target_duration_min?: number;
  target_duration_max?: number;
}

const WEDDING_FILM_TEMPLATES: FilmDef[] = [
  { name: '90 Second Snapshot Film', film_type: FilmType.MONTAGE, target_duration_min: 80, target_duration_max: 100 },
  { name: '2 Minute Snapshot Film', film_type: FilmType.MONTAGE, target_duration_min: 110, target_duration_max: 130 },
  { name: '7 Minute Highlights Film', film_type: FilmType.MONTAGE, target_duration_min: 390, target_duration_max: 450 },
  { name: 'Feature Film', film_type: FilmType.FEATURE },
  { name: 'Ceremony Film', film_type: FilmType.ACTIVITY },
  { name: 'First Dance Film', film_type: FilmType.ACTIVITY },
  { name: 'Speech Film', film_type: FilmType.ACTIVITY },
];

// ═══════════════════════════════════════════════════════════════════════
// PART 1 — Wedding Packages
// ═══════════════════════════════════════════════════════════════════════

interface PackageDef {
  name: string;
  description: string;
  films: string[];
  crewSlotCount: number;
  soundEngineerSlots?: number;
  cameraCount: number;
  hasDrone: boolean;
  activityNames: string[];
  features: string[];
}

const WEDDING_PACKAGES: PackageDef[] = [
  {
    name: 'The Starter Package',
    description: 'Capture the most important moments with our Snapshot Film and relive your ceremony in full.',
    films: ['90 Second Snapshot Film', 'Ceremony Film'],
    crewSlotCount: 1, cameraCount: 2, hasDrone: false,
    activityNames: ['Ceremony', 'Confetti & Photos', 'Reception Entry', 'Formal Dinner', 'Cake Cut & Speeches', 'First Dance & Evening'],
    features: ['90 Second Snapshot Film', '1 Camera Operator, 2 Cameras', 'Ceremony Film', 'Filming from Ceremony to First Dance'],
  },
  {
    name: 'The Essentials Package',
    description: 'Add stunning aerial views to your films and relive your ceremony, first dance and speeches.',
    films: ['2 Minute Snapshot Film', 'Ceremony Film', 'First Dance Film', 'Speech Film'],
    crewSlotCount: 1, cameraCount: 3, hasDrone: false,
    activityNames: ['Ceremony', 'Confetti & Photos', 'Reception Entry', 'Formal Dinner', 'Cake Cut & Speeches', 'First Dance & Evening'],
    features: ['2 Minute Snapshot Film', '1 Camera Operator, 3 Cameras', 'Ceremony Film', 'First Dance Film', 'Up to 3 Speech Films', 'Filming from Ceremony to First Dance'],
  },
  {
    name: 'The Highlights Package',
    description: 'Watch more of your special day with a longer Highlights Film, a richer and more extensive cinematic memory.',
    films: ['7 Minute Highlights Film', 'Ceremony Film', 'First Dance Film', 'Speech Film'],
    crewSlotCount: 1, soundEngineerSlots: 1, cameraCount: 3, hasDrone: true,
    activityNames: ['Getting Ready', 'Ceremony', 'Confetti & Photos', 'Reception Entry', 'Formal Dinner', 'Cake Cut & Speeches', 'First Dance & Evening'],
    features: ['7 Minute Highlights Film', '1 Camera Operator, 3 Cameras', 'Drone Footage', 'Ceremony Film', 'First Dance Film', 'Up to 3 Speech Films', 'Filming from Preparations to The Dance Floor'],
  },
  {
    name: 'The Film Package',
    description: 'Your complete wedding story, a timeless cinematic treasure.',
    films: ['Feature Film', '90 Second Snapshot Film', 'Ceremony Film', 'First Dance Film', 'Speech Film'],
    crewSlotCount: 2, soundEngineerSlots: 1, cameraCount: 5, hasDrone: true,
    activityNames: ['Getting Ready', 'Ceremony', 'Confetti & Photos', 'Reception Entry', 'Formal Dinner', 'Cake Cut & Speeches', 'First Dance & Evening'],
    features: ['Feature Film', '90 Second Snapshot Film', '2 Camera Operators, 5 Cameras', 'Drone Footage', 'Ceremony Included', 'First Dance Included', 'All Speeches Included', '6 Additional Scenes', 'Filming from Preparations to The Dance Floor'],
  },
];

function calculateTimeFromOffset(eventStartTime: string, offsetMinutes: number): string {
  const [h, m] = eventStartTime.split(':').map(Number);
  const totalMin = h * 60 + m + offsetMinutes;
  const hours = Math.floor(totalMin / 60) % 24;
  const mins = totalMin % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

async function seedWeddingPackages(brandId: number): Promise<SeedSummary> {
  logger.sectionHeader('Wedding Packages');

  let created = 0;
  let skipped = 0;

  // Find Traditional British Wedding type
  const weddingType = await prisma.eventSubtype.findFirst({
    where: { name: '🇬🇧 Traditional British Wedding', is_system_seeded: true },
    include: {
      activities: { orderBy: { order_index: 'asc' }, include: {
        moments: { orderBy: { order_index: 'asc' } },
        activity_locations: { include: { wedding_type_location: true } },
        activity_subjects: { include: { wedding_type_subject: true } },
      }},
      locations: { orderBy: { order_index: 'asc' } },
      subjects: { orderBy: { order_index: 'asc' } },
    },
  });

  if (!weddingType) {
    logger.warning('Traditional British Wedding type not found. Run services seed first.');
    return { created: 0, updated: 0, skipped: 0, total: 0 };
  }

  // Get or create Wedding Day event day template
  let weddingDayTemplate = await prisma.eventDay.findFirst({ where: { brand_id: brandId, name: 'Wedding Day' } });
  if (!weddingDayTemplate) {
    weddingDayTemplate = await prisma.eventDay.create({
      data: { brand_id: brandId, name: 'Wedding Day', description: 'Main wedding day event', order_index: 1, is_active: true },
    });
  }

  const [videographerRole, soundEngineerRole] = await Promise.all([
    prisma.job_roles.findUnique({ where: { name: 'videographer' } }),
    prisma.job_roles.findUnique({ where: { name: 'sound_engineer' } }),
  ]);

  // Create/find film templates
  const filmMap = new Map<string, number>();
  for (const filmDef of WEDDING_FILM_TEMPLATES) {
    let film = await prisma.film.findFirst({ where: { brand_id: brandId, name: filmDef.name } });
    if (!film) {
      film = await prisma.film.create({
        data: { brand_id: brandId, name: filmDef.name, film_type: filmDef.film_type, target_duration_min: filmDef.target_duration_min ?? null, target_duration_max: filmDef.target_duration_max ?? null },
      });
      logger.created(`Film template "${filmDef.name}"`, undefined, 'verbose');
    }
    filmMap.set(filmDef.name, film.id);
  }

  // Create packages
  for (const pkgDef of WEDDING_PACKAGES) {
    const existing = await prisma.service_packages.findFirst({ where: { brand_id: brandId, name: pkgDef.name } });
    if (existing) { skipped++; logger.skipped(`"${pkgDef.name}"`, 'already exists'); continue; }

    const pkg = await prisma.service_packages.create({
      data: {
        brand_id: brandId, wedding_type_id: weddingType.id, name: pkgDef.name,
        description: pkgDef.description, category: 'Wedding', is_active: true,
        contents: { features: pkgDef.features },
      },
    });

    const pkgEventDay = await prisma.packageEventDay.create({
      data: { package_id: pkg.id, event_day_template_id: weddingDayTemplate.id, order_index: 1 },
    });

    // Link films
    let filmOrder = 0;
    for (const filmName of pkgDef.films) {
      const filmId = filmMap.get(filmName);
      if (filmId) await prisma.packageFilm.create({ data: { package_id: pkg.id, film_id: filmId, order_index: filmOrder++ } });
    }

    // Crew slots
    const crewSlotIds: number[] = [];
    for (let i = 0; i < pkgDef.crewSlotCount; i++) {
      const slot = await prisma.packageCrewSlot.create({
        data: {
          package_id: pkg.id, package_event_day_id: pkgEventDay.id,
          label: pkgDef.crewSlotCount === 1 ? null : i === 0 ? 'Lead Videographer' : `Videographer ${i + 1}`,
          job_role_id: videographerRole!.id, order_index: i,
        },
      });
      crewSlotIds.push(slot.id);
    }
    // Sound engineer crew slots (linked to activities = Activity Coverage tasks auto-gen for them)
    if (pkgDef.soundEngineerSlots && soundEngineerRole) {
      for (let i = 0; i < pkgDef.soundEngineerSlots; i++) {
        const slot = await prisma.packageCrewSlot.create({
          data: {
            package_id: pkg.id, package_event_day_id: pkgEventDay.id,
            label: pkgDef.soundEngineerSlots === 1 ? 'Sound Engineer' : `Sound Engineer ${i + 1}`,
            job_role_id: soundEngineerRole.id, order_index: pkgDef.crewSlotCount + i,
          },
        });
        crewSlotIds.push(slot.id);
      }
    }

    // Subjects from wedding type
    const subjectMap = new Map<number, number>();
    for (const subject of weddingType.subjects) {
      const pkgSubject = await prisma.packageDaySubject.create({
        data: { package_id: pkg.id, event_day_template_id: weddingDayTemplate.id, name: subject.name, order_index: subject.order_index },
      });
      subjectMap.set(subject.id, pkgSubject.id);
    }

    // Location slots
    const locationSlotMap = new Map<number, number>();
    for (let i = 0; i < weddingType.locations.length && i < 5; i++) {
      const slot = await prisma.packageLocationSlot.create({
        data: { package_id: pkg.id, event_day_template_id: weddingDayTemplate.id, location_number: i + 1 },
      });
      locationSlotMap.set(weddingType.locations[i].id, slot.id);
    }

    // Activities scoped to coverage window
    let activityCount = 0;
    let momentCount = 0;
    for (const activity of weddingType.activities) {
      if (!pkgDef.activityNames.includes(activity.name)) continue;
      const startTime = calculateTimeFromOffset(weddingType.event_start_time, activity.start_time_offset_minutes);
      const pkgActivity = await prisma.packageActivity.create({
        data: {
          package_id: pkg.id, package_event_day_id: pkgEventDay.id,
          name: activity.name, description: activity.description, color: activity.color, icon: activity.icon,
          start_time: startTime, duration_minutes: activity.duration_minutes, order_index: activity.order_index,
        },
      });
      activityCount++;

      for (const moment of activity.moments) {
        await prisma.packageActivityMoment.create({
          data: { package_activity_id: pkgActivity.id, name: moment.name, order_index: moment.order_index, duration_seconds: moment.duration_seconds, is_required: moment.is_key_moment },
        });
        momentCount++;
      }

      for (const actSubj of activity.activity_subjects) {
        const pkgSubjectId = subjectMap.get(actSubj.wedding_type_subject_id);
        if (pkgSubjectId) await prisma.packageDaySubjectActivity.create({ data: { package_day_subject_id: pkgSubjectId, package_activity_id: pkgActivity.id } });
      }

      for (const actLoc of activity.activity_locations) {
        const slotId = locationSlotMap.get(actLoc.wedding_type_location_id);
        if (slotId) await prisma.locationActivityAssignment.create({ data: { package_location_slot_id: slotId, package_activity_id: pkgActivity.id } });
      }

      // Link every crew slot to this activity (drives per_activity_crew task generation)
      for (const crewSlotId of crewSlotIds) {
        await prisma.packageCrewSlotActivity.create({ data: { package_crew_slot_id: crewSlotId, package_activity_id: pkgActivity.id } });
      }
    }

    created++;
    logger.created(`"${pkgDef.name}" (${pkgDef.films.length} films, ${pkgDef.crewSlotCount} crew, ${activityCount} activities, ${momentCount} moments)`);
  }

  const total = created + skipped;
  logger.summary('Wedding packages', { created, updated: 0, skipped, total });
  return { created, updated: 0, skipped, total };
}

// ═══════════════════════════════════════════════════════════════════════
// PART 2 — Birthday Package
// ═══════════════════════════════════════════════════════════════════════

const BIRTHDAY_DAY_ACTIVITIES = [
  {
    name: 'Guest Arrival & Drinks', color: '#f97316', icon: 'door', start_time: '16:00', duration_minutes: 45, order_index: 0,
    moments: [
      { name: 'First Guests Arrive', duration_seconds: 600, is_key_moment: false, order_index: 0 },
      { name: 'Welcome Drinks', duration_seconds: 1200, is_key_moment: false, order_index: 1 },
      { name: 'Mingling', duration_seconds: 1800, is_key_moment: false, order_index: 2 },
    ],
  },
  {
    name: 'Cake & Candles', color: '#ec4899', icon: 'cake', start_time: '18:00', duration_minutes: 20, order_index: 1,
    moments: [
      { name: 'Candle Lighting', duration_seconds: 300, is_key_moment: false, order_index: 0 },
      { name: 'Happy Birthday Singing', duration_seconds: 120, is_key_moment: true, order_index: 1 },
      { name: 'Blowing Out Candles', duration_seconds: 60, is_key_moment: true, order_index: 2 },
      { name: 'Cake Cutting', duration_seconds: 300, is_key_moment: true, order_index: 3 },
    ],
  },
  {
    name: 'Speeches & Toasts', color: '#8b5cf6', icon: 'sparkles', start_time: '18:30', duration_minutes: 30, order_index: 2,
    moments: [
      { name: 'Welcome Speech', duration_seconds: 300, is_key_moment: false, order_index: 0 },
      { name: 'Heartfelt Messages', duration_seconds: 900, is_key_moment: true, order_index: 1 },
      { name: 'Birthday Tribute', duration_seconds: 600, is_key_moment: true, order_index: 2 },
    ],
  },
  {
    name: 'Group Dancing', color: '#d946ef', icon: 'music', start_time: '19:30', duration_minutes: 60, order_index: 3,
    moments: [
      { name: 'First Dance Moment', duration_seconds: 300, is_key_moment: true, order_index: 0 },
      { name: 'Floor Fills', duration_seconds: 1800, is_key_moment: true, order_index: 1 },
      { name: 'Candid Dance Moments', duration_seconds: 900, is_key_moment: false, order_index: 2 },
    ],
  },
  {
    name: 'Candid Party Coverage', color: '#0ea5e9', icon: 'camera', start_time: '17:00', duration_minutes: 90, order_index: 4,
    moments: [
      { name: 'Table Candids', duration_seconds: 1200, is_key_moment: false, order_index: 0 },
      { name: 'Friend Group Shots', duration_seconds: 900, is_key_moment: false, order_index: 1 },
      { name: 'General Atmosphere', duration_seconds: 1800, is_key_moment: false, order_index: 2 },
    ],
  },
];

const BIRTHDAY_ROLE_NAMES = ['Birthday Person', 'Partner', 'Parents', 'Close Friends', 'Guests'];

async function seedBirthdayPackage(brandId: number): Promise<SeedSummary> {
  logger.sectionHeader('Birthday Package');

  let created = 0;
  let skipped = 0;

  const existing = await prisma.service_packages.findFirst({ where: { brand_id: brandId, name: 'The Birthday Package' } });
  if (existing) {
    skipped++;
    logger.skipped('"The Birthday Package"', 'already exists');
    return { created: 0, updated: 0, skipped: 1, total: 1 };
  }

  // Find or create Birthday Day template
  let birthdayDay = await prisma.eventDay.findFirst({ where: { brand_id: brandId, name: 'Birthday Day' } });
  if (!birthdayDay) {
    birthdayDay = await prisma.eventDay.create({
      data: { brand_id: brandId, name: 'Birthday Day', description: 'The main birthday party', order_index: 10, is_active: true },
    });
  }

  const videographerRole = await prisma.job_roles.findUnique({ where: { name: 'videographer' } });
  const category = await prisma.service_package_categories.findFirst({ where: { brand_id: brandId, name: 'Birthday' } });

  // Film deliverable
  let highlightsFilm = await prisma.film.findFirst({ where: { brand_id: brandId, name: 'Birthday Highlights Film' } });
  if (!highlightsFilm) {
    highlightsFilm = await prisma.film.create({
      data: { brand_id: brandId, name: 'Birthday Highlights Film', film_type: FilmType.MONTAGE, target_duration_min: 180, target_duration_max: 300 },
    });
  }

  // Create the package
  const pkg = await prisma.service_packages.create({
    data: {
      brand_id: brandId, name: 'The Birthday Package',
      description: 'Relive every moment of the celebration — cake, speeches, dancing and all the candid fun.',
      category: 'Birthday', category_id: category?.id ?? null, is_active: true,
      contents: { features: ['Birthday Highlights Film (3-5 min)', '1 Camera Operator, 2 Cameras', 'Cake & Candles Coverage', 'Speeches & Toasts', 'Dancing Coverage', 'Candid Party Coverage', 'Up to 4 hours filming'] },
    },
  });

  const pkgEventDay = await prisma.packageEventDay.create({
    data: { package_id: pkg.id, event_day_template_id: birthdayDay.id, order_index: 1 },
  });

  await prisma.packageFilm.create({ data: { package_id: pkg.id, film_id: highlightsFilm.id, order_index: 0 } });

  await prisma.packageCrewSlot.create({
    data: { package_id: pkg.id, package_event_day_id: pkgEventDay.id, label: 'Lead Videographer', job_role_id: videographerRole!.id, order_index: 0 },
  });

  // Subjects
  const subjectRoles = await prisma.subjectRole.findMany({
    where: { brand_id: brandId, role_name: { in: BIRTHDAY_ROLE_NAMES } },
    orderBy: { order_index: 'asc' },
  });
  for (const role of subjectRoles) {
    await prisma.packageDaySubject.create({
      data: { package_id: pkg.id, event_day_template_id: birthdayDay.id, name: role.role_name, order_index: role.order_index },
    });
  }

  // Location slots
  for (let i = 0; i < 2; i++) {
    await prisma.packageLocationSlot.create({
      data: { package_id: pkg.id, event_day_template_id: birthdayDay.id, location_number: i + 1 },
    });
  }

  // Activities
  let activityCount = 0;
  let momentCount = 0;
  for (const actDef of BIRTHDAY_DAY_ACTIVITIES) {
    const pkgActivity = await prisma.packageActivity.create({
      data: {
        package_id: pkg.id, package_event_day_id: pkgEventDay.id,
        name: actDef.name, description: `${actDef.name} – ${actDef.duration_minutes} minutes`,
        color: actDef.color, icon: actDef.icon, start_time: actDef.start_time,
        duration_minutes: actDef.duration_minutes, order_index: actDef.order_index,
      },
    });
    activityCount++;

    for (const moment of actDef.moments) {
      await prisma.packageActivityMoment.create({
        data: { package_activity_id: pkgActivity.id, name: moment.name, order_index: moment.order_index, duration_seconds: moment.duration_seconds, is_required: moment.is_key_moment },
      });
      momentCount++;
    }
  }

  // Assign to Standard slot
  const birthdaySet = await prisma.package_sets.findFirst({
    where: { brand_id: brandId, name: 'Birthday Packages' },
    include: { slots: { orderBy: { order_index: 'asc' } } },
  });
  if (birthdaySet) {
    const standardSlot = birthdaySet.slots.find((s) => s.slot_label === 'Standard');
    if (standardSlot && !standardSlot.service_package_id) {
      await prisma.package_set_slots.update({ where: { id: standardSlot.id }, data: { service_package_id: pkg.id } });
    }
  }

  created++;
  logger.created(`"The Birthday Package" (1 film, 1 crew slot, ${activityCount} activities, ${momentCount} moments)`);

  return { created, updated: 0, skipped, total: created + skipped };
}

// ═══════════════════════════════════════════════════════════════════════
// Main — runs both parts in sequence
// ═══════════════════════════════════════════════════════════════════════

async function seedPackages(): Promise<SeedSummary> {
  logger.sectionHeader('Catalog: Packages', 'Wedding packages + birthday package');
  logger.startTimer('packages');

  const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
  if (!brand) {
    logger.warning('Moonrise Films brand not found, skipping packages.');
    return { created: 0, updated: 0, skipped: 0, total: 0 };
  }

  const weddingSummary = await seedWeddingPackages(brand.id);
  const birthdaySummary = await seedBirthdayPackage(brand.id);

  const aggregate = sumSummaries(weddingSummary, birthdaySummary);
  logger.summary('Packages (total)', aggregate);
  logger.endTimer('packages', 'Packages seeding');
  return aggregate;
}

export default seedPackages;

if (require.main === module) {
  seedPackages()
    .catch((error) => {
      console.error('❌ Error seeding packages:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
