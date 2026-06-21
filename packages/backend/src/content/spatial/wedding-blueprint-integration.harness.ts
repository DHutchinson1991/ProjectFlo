import { Test, TestingModule } from '@nestjs/testing';
import { TrackType } from '@prisma/client';
import { GemmaService } from '../../ai/gemma/gemma.service';
import { AppModule } from '../../app.module';
import { PackageBlockingPlannerService } from '../activity-planning/services/package-blocking-planner.service';
import { DayBlueprintPlacementSeedService } from '../day-blueprints/services';
import { MomentKnowledgeService } from '../schedule/services/moment-knowledge.service';
import { ScenePreparationService } from '../scene-preparation/services/scene-preparation.service';
import { PackageCreationRunLogger } from '../../catalog/packages/creation/run/package-creation-run-logger';
import { DayBlueprintSnapshotService } from '../day-blueprints/services/day-blueprint-snapshot.service';
import { DayBlueprintSandboxLayoutService } from '../day-blueprints/services/day-blueprint-sandbox-layout.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { SpaceSlotSpatialSyncService } from '../../workflow/locations/modules/floor-plans/space-slot-spatial-sync.service';

export const RUN_DB_INTEGRATION = process.env.RUN_DB_INTEGRATION === '1';

export interface WeddingBlueprintFixture {
  packageId: number;
  activityId: number;
  spaceSlotId: number;
  filmId: number;
  sceneId: number;
  brandId: number;
}

export async function createIntegrationModule(
  prisma: PrismaService,
  fixture: WeddingBlueprintFixture,
): Promise<TestingModule> {
  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  const gemmaMock = createBlockingGemmaMock(prisma, fixture);
  moduleBuilder.overrideProvider(GemmaService).useValue({
    chat: gemmaMock,
    onModuleInit: jest.fn(),
  });

  return moduleBuilder.compile();
}

/** Moonrise ceremony crew labels → preferred subjects per camera (filtered to FOV per moment). */
const INTEGRATION_CAMERA_TARGETS: Record<string, string[]> = {
  'CAM1 - Lead': ['Bride', 'Groom', 'Officiant'],
  'CAM2 - Second': ['Bride', 'Groom', 'Best Man', 'Maid of Honour'],
  'CAM3 - Detail': ['Officiant'],
};

function angleToDegrees(cx: number, cy: number, sx: number, sy: number): number {
  return (Math.atan2(sy - cy, sx - cx) * 180) / Math.PI;
}

function filterTargetsInFov(
  camera: { x: number; y: number; rotation: number; fovAngle?: number | null },
  preferredNames: string[],
  subjects: Array<{ name: string; x: number; y: number }>,
): string[] {
  const fov = camera.fovAngle ?? 60;
  const halfFov = fov / 2;
  const subjectByName = new Map(subjects.map((s) => [s.name.toLowerCase(), s]));
  return preferredNames.filter((name) => {
    const subject = subjectByName.get(name.toLowerCase());
    if (!subject) return false;
    const angle = angleToDegrees(camera.x, camera.y, subject.x, subject.y);
    const dev = Math.abs(((angle - camera.rotation + 540) % 360) - 180);
    return dev <= halfFov;
  });
}

function createBlockingGemmaMock(prisma: PrismaService, fixture: WeddingBlueprintFixture) {
  return jest.fn(async (opts: { messages: Array<{ role: string; content: string }> }) => {
    const userMessage = opts.messages.find((m) => m.role === 'user')?.content ?? '';
    const momentName = userMessage.match(/^Moment: (.+)$/m)?.[1] ?? 'Ceremony moment';

    const cameras = await prisma.spaceSlotCameraPosition.findMany({
      where: { package_space_slot_id: fixture.spaceSlotId },
      orderBy: { order_index: 'asc' },
    });

    return {
      reply: JSON.stringify({
        momentDescription: `Integration blocking for ${momentName}`,
        durationSeconds: 120,
        subjects: [],
        cameras: cameras.map((camera) => ({
          label: camera.label ?? 'Camera',
          x: camera.x,
          y: camera.y,
          rotation: camera.rotation,
          // Blocking guardrails re-aim cameras after the mock reply.
          // Post-blocking reconciliation fills camera_subject_plan from final poses.
          subjectNames: [],
        })),
      }),
      model: 'integration-mock',
      provider: 'integration-mock',
      requestDurationMs: 1,
      queueWaitMs: 0,
    };
  });
}

/**
 * Materializes a disposable blueprint-mode package for the Moonrise
 * `standard-uk-wedding` Ceremony activity, including film linkage so
 * `listMomentConflicts()` has recording setups to evaluate.
 */
export async function bootstrapWeddingCeremonyPackage(
  prisma: PrismaService,
): Promise<WeddingBlueprintFixture> {
  const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
  if (!brand) {
    throw new Error('Moonrise Films brand not found — run `prisma db seed` first');
  }

  const blueprint = await prisma.dayBlueprint.findFirst({
    where: { key: 'standard-uk-wedding', is_system_seeded: true },
    select: {
      id: true,
      latest_published_version_id: true,
      versions: {
        orderBy: { version_number: 'desc' },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!blueprint) {
    throw new Error('standard-uk-wedding blueprint not found — run `prisma db seed` first');
  }

  let blueprintVersionId = blueprint.latest_published_version_id ?? blueprint.versions[0]?.id ?? null;
  if (!blueprintVersionId) {
    throw new Error('standard-uk-wedding blueprint has no version — run `prisma db seed` first');
  }

  if (!blueprint.latest_published_version_id) {
    await prisma.dayBlueprintVersion.update({
      where: { id: blueprintVersionId },
      data: { status: 'PUBLISHED', published_at: new Date() },
    });
    await prisma.dayBlueprint.update({
      where: { id: blueprint.id },
      data: { latest_published_version_id: blueprintVersionId },
    });
  }

  const ceremonyActivity = await prisma.dayBlueprintActivity.findFirst({
    where: {
      name: 'Ceremony',
      day: { day_blueprint_version_id: blueprintVersionId },
    },
    select: { id: true },
  });
  if (!ceremonyActivity) {
    throw new Error('Ceremony activity missing from standard-uk-wedding blueprint version');
  }

  const template = await prisma.packageTemplate.findFirst({
    where: { name: 'Wedding', is_system_seeded: true },
    include: {
      days: {
        orderBy: { order_index: 'asc' },
        take: 1,
      },
    },
  });
  if (!template?.days[0]) {
    throw new Error('Wedding PackageTemplate not seeded');
  }

  const videographerRole = await prisma.job_roles.findUnique({ where: { name: 'videographer' } });
  if (!videographerRole) {
    throw new Error('videographer job role not seeded');
  }

  const stamp = Date.now();
  const pkg = await prisma.service_packages.create({
    data: {
      brand_id: brand.id,
      name: `integration-wedding-${stamp}`,
      event_category: 'Wedding',
      created_from_package_template_id: template.id,
      currency: 'GBP',
      is_active: false,
    },
  });

  const packageEventDay = await prisma.packageEventDay.create({
    data: {
      package_id: pkg.id,
      event_day_template_id: template.days[0].event_day_template_id,
      order_index: 0,
    },
  });

  for (let i = 0; i < 3; i++) {
    await prisma.packageCrewSlot.create({
      data: {
        package_id: pkg.id,
        package_event_day_id: packageEventDay.id,
        job_role_id: videographerRole.id,
        label: i === 0 ? 'CAM1 - Lead' : i === 1 ? 'CAM2 - Second' : 'CAM3 - Detail',
        hours: 8,
        order_index: i,
      },
    });
  }

  const snapshot = new DayBlueprintSnapshotService(prisma, new DayBlueprintSandboxLayoutService());
  await snapshot.consumeIntoPackage({
    packageId: pkg.id,
    blueprintVersionId,
    selectedActivityIds: [ceremonyActivity.id],
  });

  const activity = await prisma.packageActivity.findFirstOrThrow({
    where: { package_id: pkg.id, name: 'Ceremony' },
    select: { id: true },
  });

  const [crewSlots, daySubjects, assignment] = await Promise.all([
    prisma.packageCrewSlot.findMany({ where: { package_id: pkg.id } }),
    prisma.packageDaySubject.findMany({ where: { package_id: pkg.id } }),
    prisma.spaceActivityAssignment.findFirstOrThrow({
      where: { package_activity_id: activity.id },
      select: { package_space_slot_id: true },
    }),
  ]);

  await prisma.packageCrewSlotActivity.createMany({
    data: crewSlots.map((slot) => ({
      package_activity_id: activity.id,
      package_crew_slot_id: slot.id,
    })),
    skipDuplicates: true,
  });
  await prisma.packageDaySubjectActivity.createMany({
    data: daySubjects.map((subject) => ({
      package_activity_id: activity.id,
      package_day_subject_id: subject.id,
    })),
    skipDuplicates: true,
  });

  const spatialSync = new SpaceSlotSpatialSyncService(prisma);
  await spatialSync.syncCamerasAndSubjects(assignment.package_space_slot_id, activity.id);

  const film = await prisma.film.create({
    data: {
      name: `integration-film-${stamp}`,
      brand_id: brand.id,
    },
  });
  await prisma.filmTimelineTrack.createMany({
    data: [
      { film_id: film.id, name: 'CAM1 - Lead', type: TrackType.VIDEO, order_index: 0, is_active: true, is_unmanned: false },
      { film_id: film.id, name: 'CAM2 - Second', type: TrackType.VIDEO, order_index: 1, is_active: true, is_unmanned: false },
      { film_id: film.id, name: 'CAM3 - Detail', type: TrackType.VIDEO, order_index: 2, is_active: true, is_unmanned: true },
    ],
  });

  const scene = await prisma.filmScene.create({
    data: {
      film_id: film.id,
      name: 'Ceremony',
      order_index: 0,
      source_activity_id: activity.id,
    },
  });

  const packageFilm = await prisma.packageFilm.create({
    data: {
      package_id: pkg.id,
      film_id: film.id,
      order_index: 0,
    },
  });

  await prisma.packageFilmSceneSchedule.create({
    data: {
      package_film_id: packageFilm.id,
      scene_id: scene.id,
      event_day_template_id: packageEventDay.event_day_template_id,
      package_activity_id: activity.id,
      order_index: 0,
    },
  });

  return {
    packageId: pkg.id,
    activityId: activity.id,
    spaceSlotId: assignment.package_space_slot_id,
    filmId: film.id,
    sceneId: scene.id,
    brandId: brand.id,
  };
}

export async function runCeremonyBlockingPipeline(
  module: TestingModule,
  fixture: WeddingBlueprintFixture,
): Promise<void> {
  const prisma = module.get(PrismaService);
  const placementSeed = module.get(DayBlueprintPlacementSeedService);
  const blockingPlanner = module.get(PackageBlockingPlannerService);
  const momentKnowledge = module.get(MomentKnowledgeService);

  await placementSeed.seedPackagePlacementsFromBlueprint(fixture.packageId);

  const runLogger = new PackageCreationRunLogger({
    brandId: fixture.brandId,
    source: 'catalog',
    route: 'integration/wedding-ceremony',
    packageName: `integration-${fixture.packageId}`,
  });
  runLogger.attachPackage(fixture.packageId, `integration-${fixture.packageId}`);

  await blockingPlanner.planPackageBlocking(fixture.packageId, runLogger);
  await momentKnowledge.ensureSceneMomentsForActivity(fixture.sceneId, fixture.activityId);
  await createMomentRecordingSetups(module, fixture);
}

/**
 * After blocking re-aims cameras, write FOV-safe `camera_subject_plan` rows
 * using the persisted moment overrides (same geometry `listMomentConflicts` reads).
 */
export async function reconcileIntegrationCameraSubjectPlans(
  prisma: PrismaService,
  fixture: WeddingBlueprintFixture,
): Promise<void> {
  const moments = await prisma.packageActivityMoment.findMany({
    where: { package_activity_id: fixture.activityId },
    select: { id: true },
    orderBy: { order_index: 'asc' },
  });

  for (const moment of moments) {
    const [cameras, subjectPositions] = await Promise.all([
      prisma.spaceSlotCameraPosition.findMany({
        where: { package_space_slot_id: fixture.spaceSlotId },
        include: { moment_overrides: { where: { moment_id: moment.id } } },
        orderBy: { order_index: 'asc' },
      }),
      prisma.spaceSlotSubjectPosition.findMany({
        where: { package_space_slot_id: fixture.spaceSlotId },
        include: {
          day_subject: { select: { name: true } },
          moment_overrides: { where: { moment_id: moment.id } },
        },
        orderBy: { order_index: 'asc' },
      }),
    ]);

    const subjects = subjectPositions
      .map((pos) => {
        const override = pos.moment_overrides[0];
        const name = pos.day_subject?.name;
        if (!name) return null;
        return {
          name,
          x: override?.x ?? pos.x,
          y: override?.y ?? pos.y,
        };
      })
      .filter((row): row is { name: string; x: number; y: number } => row != null);

    const cameraSubjectPlan: Record<string, string[]> = {};
    for (const camera of cameras) {
      const label = camera.label ?? 'Camera';
      const override = camera.moment_overrides[0];
      const camPose = {
        x: override?.x ?? camera.x,
        y: override?.y ?? camera.y,
        rotation: override?.rotation ?? camera.rotation,
        fovAngle: override?.fov_angle ?? camera.fov_angle,
      };
      const preferred = INTEGRATION_CAMERA_TARGETS[label] ?? [];
      cameraSubjectPlan[label] = filterTargetsInFov(camPose, preferred, subjects);
    }

    await prisma.packageActivityMoment.update({
      where: { id: moment.id },
      data: { camera_subject_plan: cameraSubjectPlan },
    });
  }
}

/** Mirrors SchedulePackageService autoCreateRecordingSetups for integration tests. */
async function createMomentRecordingSetups(
  module: TestingModule,
  fixture: WeddingBlueprintFixture,
): Promise<void> {
  const prisma = module.get(PrismaService);
  const tracks = await prisma.filmTimelineTrack.findMany({
    where: { film_id: fixture.filmId, is_active: true, type: TrackType.VIDEO },
    orderBy: { order_index: 'asc' },
  });
  const audioTrackIds = (
    await prisma.filmTimelineTrack.findMany({
      where: { film_id: fixture.filmId, is_active: true, type: TrackType.AUDIO },
      select: { id: true },
    })
  ).map((track) => track.id);

  const sceneMoments = await prisma.sceneMoment.findMany({
    where: { film_scene_id: fixture.sceneId },
    select: { id: true, package_activity_moment_id: true },
  });

  const daySubjects = await prisma.packageDaySubject.findMany({
    where: { package_id: fixture.packageId },
    select: { id: true, name: true },
  });
  const subjectNameToId = new Map(
    daySubjects.filter((s) => s.name).map((s) => [s.name!.toLowerCase(), s.id]),
  );

  const cameraPositions = await prisma.spaceSlotCameraPosition.findMany({
    where: { package_space_slot_id: fixture.spaceSlotId },
    orderBy: { order_index: 'asc' },
  });

  for (const moment of sceneMoments) {
    const existing = await prisma.momentRecordingSetup.findUnique({
      where: { moment_id: moment.id },
    });
    if (existing) continue;

    const pkgMomentId = moment.package_activity_moment_id;
    const subjectPositions = await prisma.spaceSlotSubjectPosition.findMany({
      where: { package_space_slot_id: fixture.spaceSlotId },
      include: {
        day_subject: { select: { name: true } },
        moment_overrides: pkgMomentId
          ? { where: { moment_id: pkgMomentId } }
          : { take: 0 },
      },
      orderBy: { order_index: 'asc' },
    });

    const cameraOverrides = pkgMomentId
      ? await prisma.spaceSlotMomentCamera.findMany({
          where: { moment_id: pkgMomentId },
          select: {
            camera_position_id: true,
            x: true,
            y: true,
            rotation: true,
            fov_angle: true,
          },
        })
      : [];
    const cameraOverrideByPositionId = new Map(
      cameraOverrides.map((row) => [row.camera_position_id, row]),
    );

    const subjects = subjectPositions
      .map((pos) => {
        const override = pos.moment_overrides[0];
        const name = pos.day_subject?.name;
        if (!name) return null;
        return {
          name,
          x: override?.x ?? pos.x,
          y: override?.y ?? pos.y,
        };
      })
      .filter((row): row is { name: string; x: number; y: number } => row != null);

    await prisma.momentRecordingSetup.create({
      data: {
        moment_id: moment.id,
        audio_track_ids: audioTrackIds,
        camera_assignments: {
          create: tracks.map((track, index) => {
            const camera = cameraPositions[index];
            const override = camera ? cameraOverrideByPositionId.get(camera.id) : undefined;
            const camPose = {
              x: override?.x ?? camera?.x ?? 500,
              y: override?.y ?? camera?.y ?? 500,
              rotation: override?.rotation ?? camera?.rotation ?? 0,
              fovAngle: override?.fov_angle ?? camera?.fov_angle ?? 60,
            };

            const preferred = INTEGRATION_CAMERA_TARGETS[track.name] ?? [];
            const visibleNames = filterTargetsInFov(camPose, preferred, subjects);
            const subjectIds = visibleNames
              .map((name) => subjectNameToId.get(name.toLowerCase()))
              .filter((id): id is number => typeof id === 'number');

            return {
              track_id: track.id,
              subject_ids: subjectIds,
            };
          }),
        },
      },
    });
  }
}

export async function cleanupWeddingCeremonyPackage(
  prisma: PrismaService,
  fixture: WeddingBlueprintFixture,
): Promise<void> {
  await prisma.service_packages.delete({ where: { id: fixture.packageId } }).catch(() => undefined);
  await prisma.film.delete({ where: { id: fixture.filmId } }).catch(() => undefined);
}
