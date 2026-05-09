import { Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  AddPackageEventDayDto,
  SetPackageEventDaysDto,
  CreatePackageFilmDto,
  UpdatePackageFilmDto,
  UpsertPackageFilmSceneScheduleDto,
} from '../dto';
import { MomentKnowledgeService } from './moment-knowledge.service';
import { ScenePreparationService } from '../../scene-preparation/services/scene-preparation.service';

@Injectable()
export class SchedulePackageService {
  private readonly logger = new Logger(SchedulePackageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly momentKnowledge: MomentKnowledgeService,
    @Inject(forwardRef(() => ScenePreparationService))
    private readonly scenePrep: ScenePreparationService,
  ) {}

  // ─── Package Schedule Summary ──────────────────────────────────────

  async getPackageScheduleSummary(packageId: number) {
    const pkg = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { id: true, name: true, description: true },
    });
    if (!pkg) throw new NotFoundException(`Package ${packageId} not found`);

    const [eventDayCount, activityCount, momentCount, subjectCount, locationSlotCount, crewSlotCount, filmCount, eventDays] =
      await Promise.all([
        this.prisma.packageEventDay.count({ where: { package_id: packageId } }),
        this.prisma.packageActivity.count({ where: { package_id: packageId } }),
        this.prisma.packageActivityMoment.count({ where: { package_activity: { package_id: packageId } } }),
        this.prisma.packageDaySubject.count({ where: { package_id: packageId } }),
        this.prisma.packageLocationSlot.count({ where: { package_id: packageId } }),
        this.prisma.packageCrewSlot.count({ where: { package_id: packageId } }),
        this.prisma.packageFilm.count({ where: { package_id: packageId } }),
        this.prisma.packageEventDay.findMany({
          where: { package_id: packageId },
          include: { event_day: { select: { id: true, name: true } } },
          orderBy: { order_index: 'asc' },
        }),
      ]);

    return {
      package_id: packageId,
      package_name: pkg.name,
      package_description: pkg.description,
      has_schedule_data: eventDayCount > 0 || activityCount > 0,
      counts: { event_days: eventDayCount, activities: activityCount, moments: momentCount, subjects: subjectCount, location_slots: locationSlotCount, crew_slots: crewSlotCount, films: filmCount },
      event_day_names: eventDays.map((d) => d.event_day?.name ?? `Day ${d.order_index + 1}`),
    };
  }

  // ─── Package Event Days ──────────────────────────────────────────────

  async getPackageEventDays(packageId: number) {
    const rows = await this.prisma.packageEventDay.findMany({
      where: { package_id: packageId },
      include: { event_day: true },
      orderBy: { order_index: 'asc' },
    });
    return rows.map((row) => ({ ...row.event_day, order_index: row.order_index, _joinId: row.id }));
  }

  async addPackageEventDay(packageId: number, dto: AddPackageEventDayDto) {
    const existing = await this.prisma.packageEventDay.findMany({
      where: { package_id: packageId },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    const row = await this.prisma.packageEventDay.create({
      data: { package_id: packageId, event_day_template_id: dto.event_day_template_id, order_index: dto.order_index ?? nextOrder },
      include: { event_day: true },
    });
    return { ...row.event_day, order_index: row.order_index, _joinId: row.id };
  }

  async removePackageEventDay(packageId: number, eventDayId: number) {
    const record = await this.prisma.packageEventDay.findUnique({
      where: { package_id_event_day_template_id: { package_id: packageId, event_day_template_id: eventDayId } },
    });
    if (!record) throw new NotFoundException('Package event day assignment not found');
    return this.prisma.packageEventDay.delete({ where: { id: record.id } });
  }

  async setPackageEventDays(packageId: number, dto: SetPackageEventDaysDto) {
    await this.prisma.packageEventDay.deleteMany({ where: { package_id: packageId } });
    const creates = dto.event_day_template_ids.map((templateId, idx) =>
      this.prisma.packageEventDay.create({ data: { package_id: packageId, event_day_template_id: templateId, order_index: idx } }),
    );
    await Promise.all(creates);
    return this.getPackageEventDays(packageId);
  }

  // ─── Package Films ──────────────────────────────────────────────────

  async getPackageFilms(packageId: number) {
    return this.prisma.packageFilm.findMany({
      where: { package_id: packageId },
      include: {
        film: { include: { scenes: { orderBy: { order_index: 'asc' }, include: { moments: { orderBy: { order_index: 'asc' } }, beats: { orderBy: { order_index: 'asc' } } } } } },
        scene_schedules: { include: { event_day: true }, orderBy: { order_index: 'asc' } },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createPackageFilm(packageId: number, dto: CreatePackageFilmDto) {
    return this.prisma.packageFilm.create({
      data: { package_id: packageId, film_id: dto.film_id, order_index: dto.order_index ?? 0, notes: dto.notes },
      include: { film: true, scene_schedules: true },
    });
  }

  async updatePackageFilm(packageFilmId: number, dto: UpdatePackageFilmDto) {
    return this.prisma.packageFilm.update({ where: { id: packageFilmId }, data: dto });
  }

  async deletePackageFilm(packageFilmId: number) {
    return this.prisma.packageFilm.delete({ where: { id: packageFilmId } });
  }

  // ─── Package Film Scene Schedules ────────────────────────────────────

  async getPackageFilmSchedule(packageFilmId: number) {
    const packageFilm = await this.prisma.packageFilm.findUnique({
      where: { id: packageFilmId },
      include: {
        film: {
          include: {
            scenes: { orderBy: { order_index: 'asc' }, include: { moments: { orderBy: { order_index: 'asc' } }, beats: { orderBy: { order_index: 'asc' } }, schedule: { include: { event_day: true } } } },
            scene_schedules: { include: { event_day: true }, orderBy: { order_index: 'asc' } },
          },
        },
        scene_schedules: { include: { event_day: true }, orderBy: { order_index: 'asc' } },
      },
    });
    if (!packageFilm) throw new NotFoundException('Package film not found');
    return packageFilm;
  }

  async upsertPackageFilmSceneSchedule(packageFilmId: number, dto: UpsertPackageFilmSceneScheduleDto) {
    const packageFilm = await this.prisma.packageFilm.findUnique({ where: { id: packageFilmId } });
    if (!packageFilm) throw new NotFoundException('Package film not found');

    const schedule = await this.prisma.packageFilmSceneSchedule.upsert({
      where: { package_film_id_scene_id: { package_film_id: packageFilmId, scene_id: dto.scene_id } },
      create: {
        package_film_id: packageFilmId, scene_id: dto.scene_id,
        event_day_template_id: dto.event_day_template_id, scheduled_start_time: dto.scheduled_start_time,
        scheduled_duration_minutes: dto.scheduled_duration_minutes, moment_schedules: dto.moment_schedules ?? undefined,
        beat_schedules: dto.beat_schedules ?? undefined, notes: dto.notes, order_index: dto.order_index ?? 0,
        package_activity_id: dto.package_activity_id ?? null,
      },
      update: {
        event_day_template_id: dto.event_day_template_id, scheduled_start_time: dto.scheduled_start_time,
        scheduled_duration_minutes: dto.scheduled_duration_minutes, moment_schedules: dto.moment_schedules ?? undefined,
        beat_schedules: dto.beat_schedules ?? undefined, notes: dto.notes, order_index: dto.order_index,
        package_activity_id: dto.package_activity_id,
      },
      include: { event_day: true },
    });

    if (dto.package_activity_id) {
      await this.autoPopulateSceneMomentsFromActivity(dto.scene_id, dto.package_activity_id);
      await this.autoCreateRecordingSetups(dto.scene_id, packageFilm.film_id, dto.package_activity_id);

      // Fire-and-forget: auto-run spatial/director pipeline if the activity already has moments
      this.logger.log(
        `upsertPackageFilmSceneSchedule: launched auto-prepareScene in background for scene ${dto.scene_id} (film ${packageFilm.film_id})`,
      );
      this.scenePrep.prepareScene(dto.scene_id, packageFilm.film_id, 'package').catch((err) =>
        this.logger.warn(`Auto-prepareScene failed for scene ${dto.scene_id}: ${(err as Error).message}`),
      );
    }
    return schedule;
  }

  async bulkUpsertPackageFilmSceneSchedules(packageFilmId: number, schedules: UpsertPackageFilmSceneScheduleDto[]) {
    const results: Awaited<ReturnType<typeof this.upsertPackageFilmSceneSchedule>>[] = [];
    for (const dto of schedules) {
      results.push(await this.upsertPackageFilmSceneSchedule(packageFilmId, dto));
    }
    return results;
  }

  /**
   * Auto-populate SceneMoment records from package activity moments.
   * Falls back to the moment knowledge base when the activity has no custom moments yet.
   */
  private async autoPopulateSceneMomentsFromActivity(sceneId: number, activityId: number) {
    await this.momentKnowledge.ensureSceneMomentsForActivity(sceneId, activityId);
  }

  /**
   * Auto-create MomentRecordingSetup + CameraSubjectAssignment records
   * so prepareScene can find cameras to assign shots to.
   */
  private async autoCreateRecordingSetups(sceneId: number, filmId: number, activityId?: number) {
    const tracks = await this.prisma.filmTimelineTrack.findMany({
      where: { film_id: filmId, is_active: true },
    });
    const videoTracks = tracks.filter((t) => t.type === 'VIDEO');
    const videoTrackIds = videoTracks.map((t) => t.id);
    const audioTrackIds = tracks.filter((t) => t.type === 'AUDIO').map((t) => t.id);

    if (videoTrackIds.length === 0) return;

    // ── Ensure SpaceSlotCameraPosition records exist for all video tracks ──
    if (activityId) {
      await this.ensureSpaceSlotCameraPositions(activityId, videoTracks);
    }

    // Look up existing SceneCameraPosition records so we can link them
    const sceneCamPositions = await this.prisma.sceneCameraPosition.findMany({
      where: { scene_id: sceneId, track_id: { in: videoTrackIds } },
    });
    const positionByTrack = new Map(sceneCamPositions.map((cp) => [cp.track_id, cp.id]));

    // Scene-level recording setup
    const existingScene = await this.prisma.sceneRecordingSetup.findUnique({ where: { scene_id: sceneId } });
    if (!existingScene) {
      await this.prisma.sceneRecordingSetup.create({
        data: {
          scene_id: sceneId,
          audio_track_ids: audioTrackIds,
          camera_assignments: {
            createMany: { data: videoTrackIds.map((tid) => ({ track_id: tid })) },
          },
        },
      });
    }

    // Moment-level recording setups
    const moments = await this.prisma.sceneMoment.findMany({
      where: { film_scene_id: sceneId },
      select: { id: true, package_activity_moment_id: true },
    });

    // Load PackageActivityMoment.camera_subject_plan for each linked moment so
    // we can propagate the package-level blocking plan (camera label → subject
    // names) into film-scope CameraSubjectAssignment.subject_ids. This is what
    // makes films created from packages inherit editorial camera→subject
    // targeting from the `PackageBlockingPlannerService` pass.
    const linkedPkgMomentIds = moments
      .map((m) => m.package_activity_moment_id)
      .filter((id): id is number => typeof id === 'number');
    const pkgMoments = linkedPkgMomentIds.length
      ? await this.prisma.packageActivityMoment.findMany({
          where: { id: { in: linkedPkgMomentIds } },
          select: { id: true, camera_subject_plan: true },
        })
      : [];
    const planByPkgMomentId = new Map<number, Record<string, string[]>>();
    for (const pm of pkgMoments) {
      const plan = pm.camera_subject_plan as unknown;
      if (plan && typeof plan === 'object') {
        planByPkgMomentId.set(pm.id, plan as Record<string, string[]>);
      }
    }

    // Build subject name → PackageDaySubject id map for this package.
    // `CameraSubjectAssignment.subject_ids` holds PackageDaySubject IDs (same
    // convention as `BlockingDirectorService.writeResults`).
    let subjectNameToDaySubjectId = new Map<string, number>();
    if (activityId && planByPkgMomentId.size > 0) {
      const activity = await this.prisma.packageActivity.findUnique({
        where: { id: activityId },
        select: { package_id: true },
      });
      if (activity?.package_id) {
        const daySubjects = await this.prisma.packageDaySubject.findMany({
          where: { package_id: activity.package_id },
          select: { id: true, name: true },
        });
        subjectNameToDaySubjectId = new Map(
          daySubjects
            .filter((s) => !!s.name)
            .map((s) => [s.name!.toLowerCase(), s.id]),
        );
      }
    }

    const resolveSubjectIdsFor = (
      pkgMomentId: number | null,
      trackName: string,
    ): number[] => {
      if (pkgMomentId == null) return [];
      const plan = planByPkgMomentId.get(pkgMomentId);
      if (!plan) return [];
      const names = plan[trackName] ?? plan[trackName.toLowerCase()];
      if (!Array.isArray(names) || names.length === 0) return [];
      return names
        .map((n) => subjectNameToDaySubjectId.get(String(n).toLowerCase()))
        .filter((id): id is number => typeof id === 'number');
    };

    const videoTrackById = new Map(videoTracks.map((t) => [t.id, t]));

    for (const moment of moments) {
      const existing = await this.prisma.momentRecordingSetup.findUnique({
        where: { moment_id: moment.id },
      });
      if (existing) continue;

      await this.prisma.momentRecordingSetup.create({
        data: {
          moment_id: moment.id,
          audio_track_ids: audioTrackIds,
          camera_assignments: {
            createMany: {
              data: videoTrackIds.map((tid) => {
                const track = videoTrackById.get(tid);
                const subjectIds = resolveSubjectIdsFor(
                  moment.package_activity_moment_id ?? null,
                  track?.name ?? '',
                );
                return {
                  track_id: tid,
                  subject_ids: subjectIds,
                  scene_camera_position_id: positionByTrack.get(tid) ?? null,
                };
              }),
            },
          },
        },
      });
    }

    this.logger.log(
      `Auto-created recording setups for scene ${sceneId}: ${moments.length} moments × ${videoTrackIds.length} cameras` +
        (planByPkgMomentId.size > 0
          ? ` (propagated camera_subject_plan for ${planByPkgMomentId.size} moment(s))`
          : ''),
    );
  }

  /**
   * Ensure a SpaceSlotCameraPosition exists for every video track.
   * Creates positions for unmanned cameras that don't already have one.
   */
  private async ensureSpaceSlotCameraPositions(
    activityId: number,
    videoTracks: { id: number; name: string; is_unmanned: boolean }[],
  ) {
    const spaceAssignment = await this.prisma.spaceActivityAssignment.findFirst({
      where: { package_activity_id: activityId },
      select: { package_space_slot_id: true },
    });
    if (!spaceAssignment) return;

    const slotId = spaceAssignment.package_space_slot_id;
    const existing = await this.prisma.spaceSlotCameraPosition.findMany({
      where: { package_space_slot_id: slotId },
      select: { id: true, order_index: true, label: true },
    });

    // If we already have enough positions for all tracks, nothing to do
    if (existing.length >= videoTracks.length) return;

    // Find the crew slot for the manned videographer (to link unmanned cams to)
    const crewAssignment = await this.prisma.packageCrewSlotActivity.findFirst({
      where: { package_activity_id: activityId },
      include: {
        package_crew_slot: {
          select: { id: true, job_role: { select: { name: true } } },
        },
      },
    });
    const videographerSlotId = crewAssignment?.package_crew_slot?.job_role?.name === 'videographer'
      ? crewAssignment.package_crew_slot_id
      : null;

    let nextIdx = Math.max(-1, ...existing.map((c) => c.order_index)) + 1;

    for (let i = existing.length; i < videoTracks.length; i++) {
      const track = videoTracks[i];
      await this.prisma.spaceSlotCameraPosition.create({
        data: {
          package_space_slot_id: slotId,
          crew_slot_id: videographerSlotId,
          is_unmanned: track.is_unmanned,
          label: track.name,
          x: 500,
          y: 500,
          rotation: 0,
          order_index: nextIdx++,
        },
      });
    }

    if (videoTracks.length > existing.length) {
      this.logger.log(
        `ensureSpaceSlotCameraPositions: created ${videoTracks.length - existing.length} camera positions for activity ${activityId}`,
      );
    }
  }
}
