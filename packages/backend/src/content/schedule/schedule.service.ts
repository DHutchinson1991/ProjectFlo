import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InquiryTasksService } from '../../inquiry-tasks/inquiry-tasks.service';
import {
  CreateEventDayTemplateDto,
  UpdateEventDayTemplateDto,
  CreateFilmSceneScheduleDto,
  UpdateFilmSceneScheduleDto,
  BulkUpsertFilmSceneScheduleDto,
  CreatePackageFilmDto,
  UpdatePackageFilmDto,
  UpsertPackageFilmSceneScheduleDto,
  CreateProjectEventDayDto,
  UpdateProjectEventDayDto,
  CreateProjectFilmDto,
  UpsertProjectFilmSceneScheduleDto,
  AddPackageEventDayDto,
  SetPackageEventDaysDto,
  UpsertSchedulePresetDto,
  CreatePackageActivityDto,
  UpdatePackageActivityDto,
  CreateProjectActivityDto,
  UpdateProjectActivityDto,
  CreatePackageEventDaySubjectDto,
  UpdatePackageEventDaySubjectDto,
  CreatePackageEventDayLocationDto,
  UpdatePackageEventDayLocationDto,
  CreatePackageLocationSlotDto,
  CreatePackageActivityMomentDto,
  UpdatePackageActivityMomentDto,
  BulkCreatePackageActivityMomentsDto,
  InstanceOwner,
  CreateInstanceActivityMomentDto,
  UpdateInstanceActivityMomentDto,
  CreateInstanceEventDaySubjectDto,
  UpdateInstanceEventDaySubjectDto,
  CreateInstanceLocationSlotDto,
  CreateInstanceDayOperatorDto,
  UpdateInstanceDayOperatorDto,
} from './dto';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inquiryTasksService: InquiryTasksService,
  ) {}

  // ─── Shared Schedule Presets (Brand-level) ─────────────────────────

  async getSchedulePresets(brandId: number) {
    return this.prisma.schedulePreset.findMany({
      where: { brand_id: brandId },
      orderBy: { name: 'asc' },
    });
  }

  async upsertSchedulePreset(brandId: number, dto: UpsertSchedulePresetDto) {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('Preset name is required');
    }

    return this.prisma.schedulePreset.upsert({
      where: {
        brand_id_name: {
          brand_id: brandId,
          name,
        },
      },
      create: {
        brand_id: brandId,
        name,
        schedule_data: dto.schedule_data as object,
      },
      update: {
        schedule_data: dto.schedule_data as object,
      },
    });
  }

  async renameSchedulePreset(brandId: number, presetId: number, name: string) {
    const cleanName = name?.trim();
    if (!cleanName) {
      throw new BadRequestException('Preset name is required');
    }

    const existing = await this.prisma.schedulePreset.findFirst({
      where: { id: presetId, brand_id: brandId },
    });
    if (!existing) throw new NotFoundException('Schedule preset not found');

    return this.prisma.schedulePreset.update({
      where: { id: presetId },
      data: { name: cleanName },
    });
  }

  async deleteSchedulePreset(brandId: number, presetId: number) {
    const existing = await this.prisma.schedulePreset.findFirst({
      where: { id: presetId, brand_id: brandId },
    });
    if (!existing) throw new NotFoundException('Schedule preset not found');

    return this.prisma.schedulePreset.delete({
      where: { id: presetId },
    });
  }

  // ─── Event Day Templates ─────────────────────────────────────────────

  async findAllEventDayTemplates(brandId: number) {
    return this.prisma.eventDayTemplate.findMany({
      where: { brand_id: brandId, is_active: true },
      orderBy: { order_index: 'asc' },
      include: {
        activity_presets: {
          where: { is_active: true },
          orderBy: { order_index: 'asc' },
          include: {
            moments: { orderBy: { order_index: 'asc' } },
          },
        },
      },
    });
  }

  async findOneEventDayTemplate(id: number, brandId: number) {
    const template = await this.prisma.eventDayTemplate.findFirst({
      where: { id, brand_id: brandId },
    });
    if (!template) throw new NotFoundException('Event day template not found');
    return template;
  }

  async createEventDayTemplate(brandId: number, dto: CreateEventDayTemplateDto) {
    return this.prisma.eventDayTemplate.create({
      data: {
        brand_id: brandId,
        name: dto.name,
        description: dto.description,
        order_index: dto.order_index ?? 0,
      },
    });
  }

  async updateEventDayTemplate(id: number, brandId: number, dto: UpdateEventDayTemplateDto) {
    await this.findOneEventDayTemplate(id, brandId);
    return this.prisma.eventDayTemplate.update({
      where: { id },
      data: dto,
    });
  }

  async deleteEventDayTemplate(id: number, brandId: number) {
    await this.findOneEventDayTemplate(id, brandId);
    return this.prisma.eventDayTemplate.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // ─── Event Day Activity Presets ──────────────────────────────────────

  async findActivityPresets(eventDayTemplateId: number) {
    return this.prisma.eventDayActivityPreset.findMany({
      where: { event_day_template_id: eventDayTemplateId, is_active: true },
      orderBy: { order_index: 'asc' },
      include: {
        moments: { orderBy: { order_index: 'asc' } },
      },
    });
  }

  async createActivityPreset(eventDayTemplateId: number, dto: any) {
    return this.prisma.eventDayActivityPreset.create({
      data: {
        event_day_template_id: eventDayTemplateId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        default_start_time: dto.default_start_time,
        default_duration_minutes: dto.default_duration_minutes,
        order_index: dto.order_index ?? 0,
      },
    });
  }

  async updateActivityPreset(presetId: number, dto: any) {
    const preset = await this.prisma.eventDayActivityPreset.findUnique({ where: { id: presetId } });
    if (!preset) throw new NotFoundException('Activity preset not found');
    return this.prisma.eventDayActivityPreset.update({
      where: { id: presetId },
      data: dto,
    });
  }

  async deleteActivityPreset(presetId: number) {
    const preset = await this.prisma.eventDayActivityPreset.findUnique({ where: { id: presetId } });
    if (!preset) throw new NotFoundException('Activity preset not found');
    return this.prisma.eventDayActivityPreset.delete({ where: { id: presetId } });
  }

  async bulkCreateActivityPresets(eventDayTemplateId: number, presets: { name: string; color?: string; default_start_time?: string; description?: string; order_index?: number }[]) {
    const data = presets.map((p, i) => ({
      event_day_template_id: eventDayTemplateId,
      name: p.name,
      color: p.color,
      default_start_time: p.default_start_time,
      description: p.description,
      order_index: p.order_index ?? i,
    }));
    return this.prisma.eventDayActivityPreset.createMany({ data, skipDuplicates: true });
  }

  // ─── Preset Moments ──────────────────────────────────────────────────

  async findPresetMoments(presetId: number) {
    return this.prisma.eventDayActivityPresetMoment.findMany({
      where: { event_day_activity_preset_id: presetId },
      orderBy: { order_index: 'asc' },
    });
  }

  async createPresetMoment(presetId: number, dto: any) {
    return this.prisma.eventDayActivityPresetMoment.create({
      data: {
        event_day_activity_preset_id: presetId,
        name: dto.name,
        description: dto.description,
        duration_seconds: dto.duration_seconds ?? 60,
        order_index: dto.order_index ?? 0,
        is_key_moment: dto.is_key_moment ?? false,
      },
    });
  }

  async updatePresetMoment(momentId: number, dto: any) {
    const moment = await this.prisma.eventDayActivityPresetMoment.findUnique({ where: { id: momentId } });
    if (!moment) throw new NotFoundException('Preset moment not found');
    return this.prisma.eventDayActivityPresetMoment.update({
      where: { id: momentId },
      data: dto,
    });
  }

  async deletePresetMoment(momentId: number) {
    const moment = await this.prisma.eventDayActivityPresetMoment.findUnique({ where: { id: momentId } });
    if (!moment) throw new NotFoundException('Preset moment not found');
    return this.prisma.eventDayActivityPresetMoment.delete({ where: { id: momentId } });
  }

  async bulkCreatePresetMoments(presetId: number, moments: { name: string; duration_seconds?: number; order_index?: number; is_key_moment?: boolean }[]) {
    const data = moments.map((m, i) => ({
      event_day_activity_preset_id: presetId,
      name: m.name,
      duration_seconds: m.duration_seconds ?? 60,
      order_index: m.order_index ?? i,
      is_key_moment: m.is_key_moment ?? false,
    }));
    return this.prisma.eventDayActivityPresetMoment.createMany({ data, skipDuplicates: true });
  }

  // ─── Film Scene Schedules ────────────────────────────────────────────

  async getFilmSchedule(filmId: number) {
    const film = await this.prisma.film.findUnique({
      where: { id: filmId },
      include: {
        scenes: {
          orderBy: { order_index: 'asc' },
          include: {
            moments: { orderBy: { order_index: 'asc' } },
            beats: { orderBy: { order_index: 'asc' } },
            schedule: {
              include: { event_day: true },
            },
          },
        },
        scene_schedules: {
          include: { event_day: true },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!film) throw new NotFoundException('Film not found');
    return film;
  }

  async upsertFilmSceneSchedule(filmId: number, dto: CreateFilmSceneScheduleDto) {
    // Verify the scene belongs to this film
    const scene = await this.prisma.filmScene.findFirst({
      where: { id: dto.scene_id, film_id: filmId },
    });
    if (!scene) throw new BadRequestException('Scene does not belong to this film');

    return this.prisma.filmSceneSchedule.upsert({
      where: { scene_id: dto.scene_id },
      create: {
        film_id: filmId,
        scene_id: dto.scene_id,
        event_day_template_id: dto.event_day_template_id,
        scheduled_start_time: dto.scheduled_start_time,
        scheduled_duration_minutes: dto.scheduled_duration_minutes,
        moment_schedules: dto.moment_schedules ?? undefined,
        beat_schedules: dto.beat_schedules ?? undefined,
        notes: dto.notes,
        order_index: dto.order_index ?? scene.order_index,
      },
      update: {
        event_day_template_id: dto.event_day_template_id,
        scheduled_start_time: dto.scheduled_start_time,
        scheduled_duration_minutes: dto.scheduled_duration_minutes,
        moment_schedules: dto.moment_schedules ?? undefined,
        beat_schedules: dto.beat_schedules ?? undefined,
        notes: dto.notes,
        order_index: dto.order_index,
      },
      include: { event_day: true },
    });
  }

  async bulkUpsertFilmSceneSchedules(filmId: number, schedules: BulkUpsertFilmSceneScheduleDto[]) {
    const results: any[] = [];
    for (const dto of schedules) {
      const result = await this.upsertFilmSceneSchedule(filmId, {
        scene_id: dto.scene_id,
        event_day_template_id: dto.event_day_template_id ?? undefined,
        scheduled_start_time: dto.scheduled_start_time ?? undefined,
        scheduled_duration_minutes: dto.scheduled_duration_minutes ?? undefined,
        moment_schedules: dto.moment_schedules,
        beat_schedules: dto.beat_schedules,
        notes: dto.notes ?? undefined,
        order_index: dto.order_index,
      });
      results.push(result);
    }
    return results;
  }

  async updateFilmSceneSchedule(scheduleId: number, dto: UpdateFilmSceneScheduleDto) {
    const existing = await this.prisma.filmSceneSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!existing) throw new NotFoundException('Film scene schedule not found');

    return this.prisma.filmSceneSchedule.update({
      where: { id: scheduleId },
      data: {
        event_day_template_id: dto.event_day_template_id,
        scheduled_start_time: dto.scheduled_start_time,
        scheduled_duration_minutes: dto.scheduled_duration_minutes,
        moment_schedules: dto.moment_schedules ?? undefined,
        beat_schedules: dto.beat_schedules ?? undefined,
        notes: dto.notes,
        order_index: dto.order_index,
      },
      include: { event_day: true },
    });
  }

  async deleteFilmSceneSchedule(scheduleId: number) {
    const existing = await this.prisma.filmSceneSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!existing) throw new NotFoundException('Film scene schedule not found');

    return this.prisma.filmSceneSchedule.delete({
      where: { id: scheduleId },
    });
  }

  // ─── Package Schedule Summary ──────────────────────────────────────────

  /**
   * Get aggregate counts for a package's schedule.
   * Used for compact inline previews (e.g., needs assessment card).
   */
  async getPackageScheduleSummary(packageId: number) {
    const pkg = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { id: true, name: true, description: true },
    });
    if (!pkg) throw new NotFoundException(`Package ${packageId} not found`);

    const [
      eventDayCount,
      activityCount,
      momentCount,
      subjectCount,
      locationSlotCount,
      operatorCount,
      filmCount,
      eventDays,
    ] = await Promise.all([
      this.prisma.packageEventDay.count({ where: { package_id: packageId } }),
      this.prisma.packageActivity.count({ where: { package_id: packageId } }),
      this.prisma.packageActivityMoment.count({
        where: { package_activity: { package_id: packageId } },
      }),
      this.prisma.packageEventDaySubject.count({ where: { package_id: packageId } }),
      this.prisma.packageLocationSlot.count({ where: { package_id: packageId } }),
      this.prisma.packageDayOperator.count({ where: { package_id: packageId } }),
      this.prisma.packageFilm.count({ where: { package_id: packageId } }),
      // Event day names for a richer preview (parallel with counts)
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
      counts: {
        event_days: eventDayCount,
        activities: activityCount,
        moments: momentCount,
        subjects: subjectCount,
        location_slots: locationSlotCount,
        operators: operatorCount,
        films: filmCount,
      },
      event_day_names: eventDays.map((d) => d.event_day?.name ?? `Day ${d.order_index + 1}`),
    };
  }

  // ─── Package Event Days (Join Table) ──────────────────────────────────

  /** Get all event day templates assigned to a package */
  async getPackageEventDays(packageId: number) {
    const rows = await this.prisma.packageEventDay.findMany({
      where: { package_id: packageId },
      include: { event_day: true },
      orderBy: { order_index: 'asc' },
    });
    // Return the event day templates directly (with order from the join table)
    return rows.map((row) => ({
      ...row.event_day,
      order_index: row.order_index,
      _joinId: row.id,
    }));
  }

  /** Add an event day template to a package */
  async addPackageEventDay(packageId: number, dto: AddPackageEventDayDto) {
    // Get current max order index
    const existing = await this.prisma.packageEventDay.findMany({
      where: { package_id: packageId },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    const row = await this.prisma.packageEventDay.create({
      data: {
        package_id: packageId,
        event_day_template_id: dto.event_day_template_id,
        order_index: dto.order_index ?? nextOrder,
      },
      include: { event_day: true },
    });

    // Return same mapped shape as getPackageEventDays (template fields + _joinId)
    return {
      ...row.event_day,
      order_index: row.order_index,
      _joinId: row.id,
    };
  }

  /** Remove an event day template from a package */
  async removePackageEventDay(packageId: number, eventDayTemplateId: number) {
    const record = await this.prisma.packageEventDay.findUnique({
      where: {
        package_id_event_day_template_id: {
          package_id: packageId,
          event_day_template_id: eventDayTemplateId,
        },
      },
    });
    if (!record) throw new NotFoundException('Package event day assignment not found');

    return this.prisma.packageEventDay.delete({
      where: { id: record.id },
    });
  }

  /** Bulk set the event days for a package (replaces all current assignments) */
  async setPackageEventDays(packageId: number, dto: SetPackageEventDaysDto) {
    // Delete all existing
    await this.prisma.packageEventDay.deleteMany({
      where: { package_id: packageId },
    });

    // Create new assignments with order
    const creates = dto.event_day_template_ids.map((templateId, idx) =>
      this.prisma.packageEventDay.create({
        data: {
          package_id: packageId,
          event_day_template_id: templateId,
          order_index: idx,
        },
      }),
    );

    await Promise.all(creates);

    // Return the updated list
    return this.getPackageEventDays(packageId);
  }

  // ─── Package Films (Join Table) ──────────────────────────────────────

  async getPackageFilms(packageId: number) {
    return this.prisma.packageFilm.findMany({
      where: { package_id: packageId },
      include: {
        film: {
          include: {
            scenes: {
              orderBy: { order_index: 'asc' },
              include: {
                moments: { orderBy: { order_index: 'asc' } },
                beats: { orderBy: { order_index: 'asc' } },
              },
            },
          },
        },
        scene_schedules: {
          include: { event_day: true },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createPackageFilm(packageId: number, dto: CreatePackageFilmDto) {
    return this.prisma.packageFilm.create({
      data: {
        package_id: packageId,
        film_id: dto.film_id,
        order_index: dto.order_index ?? 0,
        notes: dto.notes,
      },
      include: {
        film: true,
        scene_schedules: true,
      },
    });
  }

  async updatePackageFilm(packageFilmId: number, dto: UpdatePackageFilmDto) {
    return this.prisma.packageFilm.update({
      where: { id: packageFilmId },
      data: dto,
    });
  }

  async deletePackageFilm(packageFilmId: number) {
    return this.prisma.packageFilm.delete({
      where: { id: packageFilmId },
    });
  }

  // ─── Package Film Scene Schedules ────────────────────────────────────

  async getPackageFilmSchedule(packageFilmId: number) {
    const packageFilm = await this.prisma.packageFilm.findUnique({
      where: { id: packageFilmId },
      include: {
        film: {
          include: {
            scenes: {
              orderBy: { order_index: 'asc' },
              include: {
                moments: { orderBy: { order_index: 'asc' } },
                beats: { orderBy: { order_index: 'asc' } },
                schedule: { include: { event_day: true } },
              },
            },
            scene_schedules: {
              include: { event_day: true },
              orderBy: { order_index: 'asc' },
            },
          },
        },
        scene_schedules: {
          include: { event_day: true },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!packageFilm) throw new NotFoundException('Package film not found');
    return packageFilm;
  }

  /**
   * Auto-populate SceneMoment records from PackageActivityMoment records.
   * Only creates moments if the scene doesn't already have any.
   * Does NOT auto-populate for MONTAGE scenes (they should only have beats).
   */
  private async autoPopulateSceneMomentsFromActivity(
    sceneId: number,
    activityId: number,
  ) {
    // Get the scene to check its mode
    const scene = await this.prisma.filmScene.findUnique({
      where: { id: sceneId },
    });
    if (!scene) return;

    // Do NOT auto-populate moments for MONTAGE scenes
    // Montage scenes should only have beats, not moments
    if (scene.mode === 'MONTAGE') {
      console.log(`[autoPopulateSceneMomentsFromActivity] Skipping auto-population for MONTAGE scene ${sceneId}`);
      return;
    }

    // Check if scene already has moments
    const existingMoments = await this.prisma.sceneMoment.count({
      where: { film_scene_id: sceneId },
    });
    if (existingMoments > 0) return; // Don't overwrite existing moments

    // Get the activity's moments
    const activityMoments = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'asc' },
    });
    if (activityMoments.length === 0) return;

    // Create SceneMoment records from activity moments
    await this.prisma.sceneMoment.createMany({
      data: activityMoments.map((am) => ({
        film_scene_id: sceneId,
        name: am.name,
        order_index: am.order_index,
        duration: am.duration_seconds,
      })),
    });
  }

  /**
   * Returns default moments for a given activity name (wedding-specific).
   * Used when auto-creating moments for new activities on wedding days.
   * Durations are in seconds representing realistic real-world timing.
   */
  private getDefaultMomentsForActivity(
    activityName: string,
  ): Array<{ name: string; order_index: number; duration_seconds: number; is_required: boolean }> {
    const DEFAULTS: Record<string, Array<{ name: string; order_index: number; duration_seconds: number; is_required: boolean }>> = {
      'Bridal Prep': [
        { name: 'Makeup & Hair', order_index: 0, duration_seconds: 3600, is_required: true },
        { name: 'Dress Reveal', order_index: 1, duration_seconds: 300, is_required: true },
        { name: 'Getting Dressed', order_index: 2, duration_seconds: 600, is_required: true },
        { name: 'Detail Shots', order_index: 3, duration_seconds: 600, is_required: true },
        { name: 'Veil & Accessories', order_index: 4, duration_seconds: 300, is_required: false },
        { name: 'Bridesmaids Reaction', order_index: 5, duration_seconds: 300, is_required: false },
        { name: 'Letter Reading', order_index: 6, duration_seconds: 300, is_required: false },
        { name: 'Gift Exchange', order_index: 7, duration_seconds: 300, is_required: false },
      ],
      'Getting Ready': [
        { name: 'Makeup & Hair', order_index: 0, duration_seconds: 3600, is_required: true },
        { name: 'Dress Reveal', order_index: 1, duration_seconds: 300, is_required: true },
        { name: 'Getting Dressed', order_index: 2, duration_seconds: 600, is_required: true },
        { name: 'Detail Shots', order_index: 3, duration_seconds: 600, is_required: true },
        { name: 'Suits Up', order_index: 4, duration_seconds: 300, is_required: false },
        { name: 'Letter Reading', order_index: 5, duration_seconds: 300, is_required: false },
        { name: 'Gift Exchange', order_index: 6, duration_seconds: 300, is_required: false },
      ],
      'Groom Prep': [
        { name: 'Suiting Up', order_index: 0, duration_seconds: 900, is_required: true },
        { name: 'Detail Shots', order_index: 1, duration_seconds: 600, is_required: true },
        { name: 'Groomsmen Jokes', order_index: 2, duration_seconds: 300, is_required: false },
        { name: 'Letter Reading', order_index: 3, duration_seconds: 300, is_required: false },
        { name: 'Gift Exchange', order_index: 4, duration_seconds: 300, is_required: false },
      ],
      'First Look': [
        { name: 'Anticipation Build', order_index: 0, duration_seconds: 300, is_required: true },
        { name: 'The Reveal', order_index: 1, duration_seconds: 180, is_required: true },
        { name: 'Reaction', order_index: 2, duration_seconds: 300, is_required: true },
        { name: 'Embrace', order_index: 3, duration_seconds: 180, is_required: false },
      ],
      'Ceremony': [
        { name: 'Guest Arrival', order_index: 0, duration_seconds: 600, is_required: false },
        { name: 'Processional', order_index: 1, duration_seconds: 180, is_required: true },
        { name: 'Opening Words', order_index: 2, duration_seconds: 300, is_required: false },
        { name: 'Readings', order_index: 3, duration_seconds: 300, is_required: false },
        { name: 'Vows', order_index: 4, duration_seconds: 180, is_required: true },
        { name: 'Ring Exchange', order_index: 5, duration_seconds: 120, is_required: true },
        { name: 'Unity Ceremony', order_index: 6, duration_seconds: 300, is_required: false },
        { name: 'First Kiss', order_index: 7, duration_seconds: 30, is_required: true },
        { name: 'Pronouncement', order_index: 8, duration_seconds: 60, is_required: true },
        { name: 'Recessional', order_index: 9, duration_seconds: 180, is_required: true },
      ],
      'Cocktail Hour': [
        { name: 'Guest Mingling', order_index: 0, duration_seconds: 1200, is_required: true },
        { name: 'Drink Service', order_index: 1, duration_seconds: 600, is_required: false },
        { name: 'Live Music/Entertainment', order_index: 2, duration_seconds: 900, is_required: false },
        { name: 'Venue Details', order_index: 3, duration_seconds: 300, is_required: false },
      ],
      'Portraits': [
        { name: 'Couple Portraits', order_index: 0, duration_seconds: 900, is_required: true },
        { name: 'Bridal Party', order_index: 1, duration_seconds: 600, is_required: true },
        { name: 'Family Formals', order_index: 2, duration_seconds: 600, is_required: true },
        { name: 'Romantic Walk', order_index: 3, duration_seconds: 300, is_required: false },
        { name: 'Creative Shots', order_index: 4, duration_seconds: 300, is_required: false },
      ],
      'Reception': [
        { name: 'Grand Entrance', order_index: 0, duration_seconds: 300, is_required: true },
        { name: 'First Dance', order_index: 1, duration_seconds: 240, is_required: true },
        { name: 'Parent Dances', order_index: 2, duration_seconds: 360, is_required: true },
        { name: 'Toasts & Speeches', order_index: 3, duration_seconds: 1800, is_required: true },
        { name: 'Dinner Service', order_index: 4, duration_seconds: 3600, is_required: false },
        { name: 'Cake Cutting', order_index: 5, duration_seconds: 300, is_required: true },
        { name: 'Bouquet Toss', order_index: 6, duration_seconds: 180, is_required: false },
        { name: 'Garter Toss', order_index: 7, duration_seconds: 180, is_required: false },
        { name: 'Open Dancing', order_index: 8, duration_seconds: 3600, is_required: true },
        { name: 'Last Dance', order_index: 9, duration_seconds: 240, is_required: false },
        { name: 'Send Off / Exit', order_index: 10, duration_seconds: 300, is_required: false },
      ],
      'Golden Hour': [
        { name: 'Couple Walk', order_index: 0, duration_seconds: 600, is_required: true },
        { name: 'Romantic Portraits', order_index: 1, duration_seconds: 600, is_required: true },
        { name: 'Silhouette Shots', order_index: 2, duration_seconds: 300, is_required: false },
        { name: 'Creative Details', order_index: 3, duration_seconds: 300, is_required: false },
      ],
      'Send Off': [
        { name: 'Sparkler Line', order_index: 0, duration_seconds: 300, is_required: false },
        { name: 'The Exit', order_index: 1, duration_seconds: 300, is_required: true },
        { name: 'Car Departure', order_index: 2, duration_seconds: 180, is_required: false },
      ],
      'Farewell': [
        { name: 'Sparkler Line', order_index: 0, duration_seconds: 300, is_required: false },
        { name: 'The Exit', order_index: 1, duration_seconds: 300, is_required: true },
        { name: 'Car Departure', order_index: 2, duration_seconds: 180, is_required: false },
      ],
    };

    const normalized = activityName.trim().toLowerCase();
    // Exact match first
    for (const [key, moments] of Object.entries(DEFAULTS)) {
      if (key.toLowerCase() === normalized) return moments;
    }
    // Partial match
    for (const [key, moments] of Object.entries(DEFAULTS)) {
      const keyLower = key.toLowerCase();
      if (normalized.includes(keyLower) || keyLower.includes(normalized)) return moments;
    }
    return [];
  }

  async upsertPackageFilmSceneSchedule(
    packageFilmId: number,
    dto: UpsertPackageFilmSceneScheduleDto,
  ) {
    const packageFilm = await this.prisma.packageFilm.findUnique({
      where: { id: packageFilmId },
    });
    if (!packageFilm) throw new NotFoundException('Package film not found');

    const schedule = await this.prisma.packageFilmSceneSchedule.upsert({
      where: {
        package_film_id_scene_id: {
          package_film_id: packageFilmId,
          scene_id: dto.scene_id,
        },
      },
      create: {
        package_film_id: packageFilmId,
        scene_id: dto.scene_id,
        event_day_template_id: dto.event_day_template_id,
        scheduled_start_time: dto.scheduled_start_time,
        scheduled_duration_minutes: dto.scheduled_duration_minutes,
        moment_schedules: dto.moment_schedules ?? undefined,
        beat_schedules: dto.beat_schedules ?? undefined,
        notes: dto.notes,
        order_index: dto.order_index ?? 0,
        package_activity_id: dto.package_activity_id ?? null,
      },
      update: {
        event_day_template_id: dto.event_day_template_id,
        scheduled_start_time: dto.scheduled_start_time,
        scheduled_duration_minutes: dto.scheduled_duration_minutes,
        moment_schedules: dto.moment_schedules ?? undefined,
        beat_schedules: dto.beat_schedules ?? undefined,
        notes: dto.notes,
        order_index: dto.order_index,
        package_activity_id: dto.package_activity_id,
      },
      include: { event_day: true },
    });

    // Auto-populate scene moments from activity moments when linking to an activity
    if (dto.package_activity_id) {
      await this.autoPopulateSceneMomentsFromActivity(dto.scene_id, dto.package_activity_id);
    }

    return schedule;
  }

  async bulkUpsertPackageFilmSceneSchedules(
    packageFilmId: number,
    schedules: UpsertPackageFilmSceneScheduleDto[],
  ) {
    const results: any[] = [];
    for (const dto of schedules) {
      const result = await this.upsertPackageFilmSceneSchedule(packageFilmId, dto);
      results.push(result);
    }
    return results;
  }

  // ─── Package Activities (real-world schedule blocks within an event day) ──

  /** Get all activities for a package (all event days) */
  async getPackageActivities(packageId: number) {
    return this.prisma.packageActivity.findMany({
      where: { package_id: packageId },
      include: {
        package_event_day: { include: { event_day: true } },
        scene_schedules: {
          include: { scene: true, package_film: { include: { film: true } } },
        },
        operators: {
          include: { contributor: { include: { contact: true } }, job_role: true, equipment: { include: { equipment: true } } },
        },
        moments: { orderBy: { order_index: 'asc' } },
      },
      orderBy: [{ package_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  /** Get activities for a specific event day within a package */
  async getPackageActivitiesByDay(packageId: number, packageEventDayId: number) {
    return this.prisma.packageActivity.findMany({
      where: { package_id: packageId, package_event_day_id: packageEventDayId },
      include: {
        scene_schedules: {
          include: { scene: true, package_film: { include: { film: true } } },
        },
        operators: {
          include: { contributor: { include: { contact: true } }, job_role: true, equipment: { include: { equipment: true } } },
        },
        moments: { orderBy: { order_index: 'asc' } },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  /** Create a new activity within a package event day */
  async createPackageActivity(packageId: number, dto: CreatePackageActivityDto) {
    // Verify the package event day exists and belongs to this package
    const ped = await this.prisma.packageEventDay.findFirst({
      where: { id: dto.package_event_day_id, package_id: packageId },
      include: { event_day: true },
    });
    if (!ped) throw new NotFoundException('Package event day not found');

    // Get next order index
    const existing = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId, package_event_day_id: dto.package_event_day_id },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    const activity = await this.prisma.packageActivity.create({
      data: {
        package_id: packageId,
        package_event_day_id: dto.package_event_day_id,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        start_time: dto.start_time,
        end_time: dto.end_time,
        duration_minutes: dto.duration_minutes,
        order_index: dto.order_index ?? nextOrder,
      },
      include: {
        package_event_day: { include: { event_day: true } },
        moments: { orderBy: { order_index: 'asc' } },
      },
    });

    // Auto-populate default moments for wedding day activities
    const isWeddingDay = ped.event_day?.name?.toLowerCase().includes('wedding');
    if (isWeddingDay) {
      const defaultMoments = this.getDefaultMomentsForActivity(dto.name);
      if (defaultMoments.length > 0) {
        await this.prisma.packageActivityMoment.createMany({
          data: defaultMoments.map((m) => ({
            package_activity_id: activity.id,
            ...m,
          })),
        });

        // Re-fetch with moments included
        return this.prisma.packageActivity.findUnique({
          where: { id: activity.id },
          include: {
            package_event_day: { include: { event_day: true } },
            moments: { orderBy: { order_index: 'asc' } },
          },
        });
      }
    }

    return activity;
  }

  /** Update a package activity */
  async updatePackageActivity(activityId: number, dto: UpdatePackageActivityDto) {
    const existing = await this.prisma.packageActivity.findUnique({
      where: { id: activityId },
    });
    if (!existing) throw new NotFoundException('Package activity not found');

    return this.prisma.packageActivity.update({
      where: { id: activityId },
      data: dto,
      include: {
        package_event_day: { include: { event_day: true } },
        scene_schedules: {
          include: { scene: true, package_film: { include: { film: true } } },
        },
        operators: {
          include: { contributor: { include: { contact: true } }, job_role: true },
        },
      },
    });
  }

  /** Delete a package activity (cascades to scene schedule assignments) */
  async deletePackageActivity(activityId: number) {
    const existing = await this.prisma.packageActivity.findUnique({
      where: { id: activityId },
    });
    if (!existing) throw new NotFoundException('Package activity not found');

    return this.prisma.packageActivity.delete({
      where: { id: activityId },
    });
  }

  /** Reorder activities within a package event day */
  async reorderPackageActivities(
    packageId: number,
    packageEventDayId: number,
    activityIds: number[],
  ) {
    const updates = activityIds.map((id, idx) =>
      this.prisma.packageActivity.updateMany({
        where: { id, package_id: packageId, package_event_day_id: packageEventDayId },
        data: { order_index: idx },
      }),
    );
    await Promise.all(updates);
    return this.getPackageActivitiesByDay(packageId, packageEventDayId);
  }

  // ─── Package Activity Moments ────────────────────────────────────────

  /** Get all moments for a package activity */
  async getActivityMoments(activityId: number) {
    const activity = await this.prisma.packageActivity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundException('Package activity not found');

    return this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'asc' },
    });
  }

  /** Create a single moment for a package activity */
  async createActivityMoment(activityId: number, dto: CreatePackageActivityMomentDto) {
    const activity = await this.prisma.packageActivity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundException('Package activity not found');

    // Get next order index
    const existing = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    return this.prisma.packageActivityMoment.create({
      data: {
        package_activity_id: activityId,
        name: dto.name,
        order_index: dto.order_index ?? nextOrder,
        duration_seconds: dto.duration_seconds ?? 60,
        is_required: dto.is_required ?? true,
        notes: dto.notes,
      },
    });
  }

  /** Bulk-create moments for an activity (e.g., auto-populate from template) */
  async bulkCreateActivityMoments(activityId: number, dto: BulkCreatePackageActivityMomentsDto) {
    const activity = await this.prisma.packageActivity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundException('Package activity not found');

    // Get current max order index
    const existing = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const startOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    const data = dto.moments.map((m, idx) => ({
      package_activity_id: activityId,
      name: m.name,
      order_index: m.order_index ?? startOrder + idx,
      duration_seconds: m.duration_seconds ?? 60,
      is_required: m.is_required ?? true,
      notes: m.notes,
    }));

    await this.prisma.packageActivityMoment.createMany({ data });

    return this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'asc' },
    });
  }

  /** Update a package activity moment */
  async updateActivityMoment(momentId: number, dto: UpdatePackageActivityMomentDto) {
    const existing = await this.prisma.packageActivityMoment.findUnique({
      where: { id: momentId },
    });
    if (!existing) throw new NotFoundException('Activity moment not found');

    return this.prisma.packageActivityMoment.update({
      where: { id: momentId },
      data: dto,
    });
  }

  /** Delete a package activity moment */
  async deleteActivityMoment(momentId: number) {
    const existing = await this.prisma.packageActivityMoment.findUnique({
      where: { id: momentId },
    });
    if (!existing) throw new NotFoundException('Activity moment not found');

    return this.prisma.packageActivityMoment.delete({
      where: { id: momentId },
    });
  }

  /** Reorder moments within an activity */
  async reorderActivityMoments(activityId: number, momentIds: number[]) {
    const updates = momentIds.map((id, idx) =>
      this.prisma.packageActivityMoment.updateMany({
        where: { id, package_activity_id: activityId },
        data: { order_index: idx },
      }),
    );
    await Promise.all(updates);

    return this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'asc' },
    });
  }

  // ─── Project Activities ──────────────────────────────────────────────

  /** Get all activities for a project event day */
  async getProjectActivities(projectId: number, projectEventDayId: number) {
    return this.prisma.projectActivity.findMany({
      where: { project_id: projectId, project_event_day_id: projectEventDayId },
      include: {
        package_activity: true,
        scene_schedules: {
          include: { scene: true, project_film: { include: { film: true } } },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  /** Create a project activity */
  async createProjectActivity(projectId: number, dto: CreateProjectActivityDto) {
    return this.prisma.projectActivity.create({
      data: {
        project_id: projectId,
        project_event_day_id: dto.project_event_day_id,
        package_activity_id: dto.package_activity_id,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        start_time: dto.start_time,
        end_time: dto.end_time,
        duration_minutes: dto.duration_minutes,
        order_index: dto.order_index ?? 0,
        notes: dto.notes,
      },
      include: { package_activity: true },
    });
  }

  /** Update a project activity */
  async updateProjectActivity(activityId: number, dto: UpdateProjectActivityDto) {
    const existing = await this.prisma.projectActivity.findUnique({
      where: { id: activityId },
    });
    if (!existing) throw new NotFoundException('Project activity not found');

    return this.prisma.projectActivity.update({
      where: { id: activityId },
      data: dto,
      include: { package_activity: true },
    });
  }

  /** Delete a project activity */
  async deleteProjectActivity(activityId: number) {
    const existing = await this.prisma.projectActivity.findUnique({
      where: { id: activityId },
    });
    if (!existing) throw new NotFoundException('Project activity not found');

    return this.prisma.projectActivity.delete({
      where: { id: activityId },
    });
  }

  // ─── Package Event Day Subjects ──────────────────────────────────────

  /** Get all subjects for a package, optionally filtered by event day */
  async getPackageEventDaySubjects(packageId: number, eventDayTemplateId?: number) {
    return this.prisma.packageEventDaySubject.findMany({
      where: {
        package_id: packageId,
        ...(eventDayTemplateId ? { event_day_template_id: eventDayTemplateId } : {}),
      },
      include: {
        role_template: { include: { subject_type: true } },
        package_activity: true,
        event_day: true,
        activity_assignments: { include: { package_activity: true } },
      },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  /** Create a subject assignment for a package event day */
  async createPackageEventDaySubject(packageId: number, dto: CreatePackageEventDaySubjectDto) {
    // Get next order index
    const existing = await this.prisma.packageEventDaySubject.findMany({
      where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    return this.prisma.packageEventDaySubject.create({
      data: {
        package_id: packageId,
        event_day_template_id: dto.event_day_template_id,
        package_activity_id: dto.package_activity_id,
        role_template_id: dto.role_template_id,
        name: dto.name,
        count: dto.count,
        category: dto.category ?? 'PEOPLE',
        notes: dto.notes,
        order_index: dto.order_index ?? nextOrder,
      },
      include: {
        role_template: { include: { subject_type: true } },
        package_activity: true,
        event_day: true,
        activity_assignments: { include: { package_activity: true } },
      },
    });
  }

  /** Update a package event day subject */
  async updatePackageEventDaySubject(subjectId: number, dto: UpdatePackageEventDaySubjectDto) {
    const record = await this.prisma.packageEventDaySubject.findUnique({
      where: { id: subjectId },
    });
    if (!record) throw new NotFoundException('Package event day subject not found');

    return this.prisma.packageEventDaySubject.update({
      where: { id: subjectId },
      data: dto,
      include: {
        role_template: { include: { subject_type: true } },
        package_activity: true,
        event_day: true,
        activity_assignments: { include: { package_activity: true } },
      },
    });
  }

  /** Delete a package event day subject */
  async deletePackageEventDaySubject(subjectId: number) {
    const record = await this.prisma.packageEventDaySubject.findUnique({
      where: { id: subjectId },
    });
    if (!record) throw new NotFoundException('Package event day subject not found');

    return this.prisma.packageEventDaySubject.delete({
      where: { id: subjectId },
    });
  }

  // ─── Subject Activity Assignments (multi-activity) ────────────────

  async assignSubjectToActivity(subjectId: number, activityId: number) {
    const existing = await this.prisma.packageEventDaySubject.findUnique({ where: { id: subjectId } });
    if (!existing) throw new NotFoundException('Package event day subject not found');

    try {
      await this.prisma.subjectActivityAssignment.create({
        data: {
          package_event_day_subject_id: subjectId,
          package_activity_id: activityId,
        },
      });
    } catch {
      // Already assigned — ignore
    }

    return this.prisma.packageEventDaySubject.findUnique({
      where: { id: subjectId },
      include: {
        role_template: { include: { subject_type: true } },
        package_activity: true,
        event_day: true,
        activity_assignments: { include: { package_activity: true } },
      },
    });
  }

  async unassignSubjectFromActivity(subjectId: number, activityId: number) {
    const existing = await this.prisma.packageEventDaySubject.findUnique({ where: { id: subjectId } });
    if (!existing) throw new NotFoundException('Package event day subject not found');

    await this.prisma.subjectActivityAssignment.deleteMany({
      where: {
        package_event_day_subject_id: subjectId,
        package_activity_id: activityId,
      },
    });

    return this.prisma.packageEventDaySubject.findUnique({
      where: { id: subjectId },
      include: {
        role_template: { include: { subject_type: true } },
        package_activity: true,
        event_day: true,
        activity_assignments: { include: { package_activity: true } },
      },
    });
  }

  // ─── Package Event Day Locations ─────────────────────────────────────

  async getPackageEventDayLocations(packageId: number, eventDayTemplateId?: number) {
    return this.prisma.packageEventDayLocation.findMany({
      where: {
        package_id: packageId,
        ...(eventDayTemplateId ? { event_day_template_id: eventDayTemplateId } : {}),
      },
      include: {
        location: true,
        package_activity: true,
        event_day: true,
      },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createPackageEventDayLocation(packageId: number, dto: CreatePackageEventDayLocationDto) {
    const existing = await this.prisma.packageEventDayLocation.findMany({
      where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    return this.prisma.packageEventDayLocation.create({
      data: {
        package_id: packageId,
        event_day_template_id: dto.event_day_template_id,
        package_activity_id: dto.package_activity_id,
        location_id: dto.location_id,
        notes: dto.notes,
        order_index: dto.order_index ?? nextOrder,
      },
      include: {
        location: true,
        package_activity: true,
        event_day: true,
      },
    });
  }

  async updatePackageEventDayLocation(locationId: number, dto: UpdatePackageEventDayLocationDto) {
    const record = await this.prisma.packageEventDayLocation.findUnique({
      where: { id: locationId },
    });
    if (!record) throw new NotFoundException('Package event day location not found');

    return this.prisma.packageEventDayLocation.update({
      where: { id: locationId },
      data: dto,
      include: {
        location: true,
        package_activity: true,
        event_day: true,
      },
    });
  }

  async deletePackageEventDayLocation(locationId: number) {
    const record = await this.prisma.packageEventDayLocation.findUnique({
      where: { id: locationId },
    });
    if (!record) throw new NotFoundException('Package event day location not found');

    return this.prisma.packageEventDayLocation.delete({
      where: { id: locationId },
    });
  }

  // ─── Package Location Slots (abstract numbered locations 1-5) ────────

  private readonly locationSlotInclude = {
    event_day: true,
    activity_assignments: { include: { package_activity: true } },
  };

  async getPackageLocationSlots(packageId: number, eventDayTemplateId?: number) {
    return this.prisma.packageLocationSlot.findMany({
      where: {
        package_id: packageId,
        ...(eventDayTemplateId ? { event_day_template_id: eventDayTemplateId } : {}),
      },
      include: this.locationSlotInclude,
      orderBy: { location_number: 'asc' },
    });
  }

  async createPackageLocationSlot(packageId: number, dto: CreatePackageLocationSlotDto) {
    let locationNumber = dto.location_number;

    if (!locationNumber) {
      // Auto-assign next available number 1-5
      const existing = await this.prisma.packageLocationSlot.findMany({
        where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
        select: { location_number: true },
        orderBy: { location_number: 'asc' },
      });
      const usedNumbers = new Set(existing.map((s) => s.location_number));
      for (let i = 1; i <= 5; i++) {
        if (!usedNumbers.has(i)) {
          locationNumber = i;
          break;
        }
      }
      if (!locationNumber) {
        throw new BadRequestException('Maximum of 5 location slots per event day');
      }
    }

    if (locationNumber < 1 || locationNumber > 5) {
      throw new BadRequestException('Location number must be between 1 and 5');
    }

    try {
      return await this.prisma.packageLocationSlot.create({
        data: {
          package_id: packageId,
          event_day_template_id: dto.event_day_template_id,
          location_number: locationNumber,
        },
        include: this.locationSlotInclude,
      });
    } catch {
      throw new BadRequestException(
        `Location ${locationNumber} already exists for this event day`,
      );
    }
  }

  async deletePackageLocationSlot(slotId: number) {
    const record = await this.prisma.packageLocationSlot.findUnique({
      where: { id: slotId },
    });
    if (!record) throw new NotFoundException('Package location slot not found');

    return this.prisma.packageLocationSlot.delete({
      where: { id: slotId },
    });
  }

  async assignLocationSlotToActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.packageLocationSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Package location slot not found');

    try {
      await this.prisma.locationActivityAssignment.create({
        data: {
          package_location_slot_id: slotId,
          package_activity_id: activityId,
        },
      });
    } catch {
      // Already assigned — ignore
    }

    return this.prisma.packageLocationSlot.findUnique({
      where: { id: slotId },
      include: this.locationSlotInclude,
    });
  }

  async unassignLocationSlotFromActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.packageLocationSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Package location slot not found');

    await this.prisma.locationActivityAssignment.deleteMany({
      where: {
        package_location_slot_id: slotId,
        package_activity_id: activityId,
      },
    });

    return this.prisma.packageLocationSlot.findUnique({
      where: { id: slotId },
      include: this.locationSlotInclude,
    });
  }

  // ─── Project Event Days ──────────────────────────────────────────────

  async getProjectEventDays(projectId: number) {
    return this.prisma.projectEventDay.findMany({
      where: { project_id: projectId },
      include: { event_day_template: true },
      orderBy: { order_index: 'asc' },
    });
  }

  async createProjectEventDay(projectId: number, dto: CreateProjectEventDayDto) {
    return this.prisma.projectEventDay.create({
      data: {
        project_id: projectId,
        event_day_template_id: dto.event_day_template_id,
        name: dto.name,
        date: new Date(dto.date),
        start_time: dto.start_time,
        end_time: dto.end_time,
        order_index: dto.order_index ?? 0,
        notes: dto.notes,
      },
      include: { event_day_template: true },
    });
  }

  async updateProjectEventDay(eventDayId: number, dto: UpdateProjectEventDayDto) {
    return this.prisma.projectEventDay.update({
      where: { id: eventDayId },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: { event_day_template: true },
    });
  }

  async deleteProjectEventDay(eventDayId: number) {
    return this.prisma.projectEventDay.delete({
      where: { id: eventDayId },
    });
  }

  // ─── Project Films ───────────────────────────────────────────────────

  async getProjectFilms(projectId: number) {
    return this.prisma.projectFilm.findMany({
      where: { project_id: projectId },
      include: {
        film: {
          include: {
            scenes: {
              orderBy: { order_index: 'asc' },
              include: {
                moments: { orderBy: { order_index: 'asc' } },
                beats: { orderBy: { order_index: 'asc' } },
                schedule: { include: { event_day: true } },
              },
            },
            scene_schedules: {
              include: { event_day: true },
            },
          },
        },
        package_film: {
          include: {
            scene_schedules: { include: { event_day: true } },
          },
        },
        scene_schedules: {
          include: { project_event_day: true },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createProjectFilm(projectId: number, dto: CreateProjectFilmDto) {
    return this.prisma.projectFilm.create({
      data: {
        project_id: projectId,
        film_id: dto.film_id,
        package_film_id: dto.package_film_id,
        order_index: dto.order_index ?? 0,
      },
      include: { film: true },
    });
  }

  async deleteProjectFilm(projectFilmId: number) {
    return this.prisma.projectFilm.delete({
      where: { id: projectFilmId },
    });
  }

  // ─── Project Film Scene Schedules ────────────────────────────────────

  async upsertProjectFilmSceneSchedule(
    projectFilmId: number,
    dto: UpsertProjectFilmSceneScheduleDto,
  ) {
    return this.prisma.projectFilmSceneSchedule.upsert({
      where: {
        project_film_id_scene_id: {
          project_film_id: projectFilmId,
          scene_id: dto.scene_id,
        },
      },
      create: {
        project_film_id: projectFilmId,
        scene_id: dto.scene_id,
        project_activity_id: dto.project_activity_id,
        project_event_day_id: dto.project_event_day_id,
        scheduled_start_time: dto.scheduled_start_time,
        scheduled_duration_minutes: dto.scheduled_duration_minutes,
        moment_schedules: dto.moment_schedules ?? undefined,
        beat_schedules: dto.beat_schedules ?? undefined,
        notes: dto.notes,
        order_index: dto.order_index ?? 0,
        is_locked: dto.is_locked ?? false,
      },
      update: {
        project_activity_id: dto.project_activity_id,
        project_event_day_id: dto.project_event_day_id,
        scheduled_start_time: dto.scheduled_start_time,
        scheduled_duration_minutes: dto.scheduled_duration_minutes,
        moment_schedules: dto.moment_schedules ?? undefined,
        beat_schedules: dto.beat_schedules ?? undefined,
        notes: dto.notes,
        order_index: dto.order_index,
        is_locked: dto.is_locked,
      },
      include: { project_event_day: true },
    });
  }

  async bulkUpsertProjectFilmSceneSchedules(
    projectFilmId: number,
    schedules: UpsertProjectFilmSceneScheduleDto[],
  ) {
    const results: any[] = [];
    for (const dto of schedules) {
      const result = await this.upsertProjectFilmSceneSchedule(projectFilmId, dto);
      results.push(result);
    }
    return results;
  }

  // ─── Resolved Schedule (Inheritance Chain) ───────────────────────────

  /**
   * Initialize a project's schedule from a package.
   * Creates ProjectEventDays, ProjectFilms, and ProjectFilmSceneSchedules
   * by inheriting from the package (or film defaults where no package override exists).
   */
  async initializeProjectFromPackage(projectId: number, packageId: number) {
    // 1. Get all package films with film data + film-level and package-level schedules
    const packageFilms = await this.prisma.packageFilm.findMany({
      where: { package_id: packageId },
      include: {
        film: {
          include: {
            scenes: {
              orderBy: { order_index: 'asc' },
              include: {
                schedule: { include: { event_day: true } },
              },
            },
          },
        },
        scene_schedules: {
          include: { event_day: true },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { order_index: 'asc' },
    });

    if (!packageFilms.length) {
      return { project_id: projectId, event_days_created: 0, films_created: 0, project_films: [] };
    }

    // 2. Collect unique event day template IDs used across all films
    const usedEventDayIds = new Set<number>();
    for (const pf of packageFilms) {
      // Package-level schedules
      for (const ss of pf.scene_schedules) {
        if (ss.event_day_template_id) usedEventDayIds.add(ss.event_day_template_id);
      }
      // Film-level defaults
      if (pf.film?.scenes) {
        for (const scene of pf.film.scenes) {
          if (scene.schedule?.event_day_template_id) {
            usedEventDayIds.add(scene.schedule.event_day_template_id);
          }
        }
      }
    }

    // 3. Create ProjectEventDay for each unique template (skip duplicates)
    const existingProjectDays = await this.prisma.projectEventDay.findMany({
      where: { project_id: projectId },
    });
    const existingTemplateIds = new Set(
      existingProjectDays
        .map(d => d.event_day_template_id)
        .filter((id): id is number => id !== null),
    );

    const eventDayMap = new Map<number, number>(); // templateId → projectEventDayId

    // Map existing project event days first
    for (const ped of existingProjectDays) {
      if (ped.event_day_template_id) {
        eventDayMap.set(ped.event_day_template_id, ped.id);
      }
    }

    // Create new ones for templates not yet in the project
    for (const templateId of usedEventDayIds) {
      if (existingTemplateIds.has(templateId)) continue;

      const template = await this.prisma.eventDayTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) continue;

      const projectEventDay = await this.prisma.projectEventDay.create({
        data: {
          project_id: projectId,
          event_day_template_id: templateId,
          name: template.name,
          date: new Date(),
          order_index: template.order_index,
        },
      });
      eventDayMap.set(templateId, projectEventDay.id);
    }

    // 4. Create ProjectFilm + ProjectFilmSceneSchedule for each package film
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdProjectFilms: any[] = [];

    for (const pf of packageFilms) {
      // Skip if project already has this film
      const existing = await this.prisma.projectFilm.findUnique({
        where: { project_id_film_id: { project_id: projectId, film_id: pf.film_id } },
      });
      if (existing) {
        createdProjectFilms.push(existing);
        continue;
      }

      const projectFilm = await this.prisma.projectFilm.create({
        data: {
          project_id: projectId,
          film_id: pf.film_id,
          package_film_id: pf.id,
          order_index: pf.order_index,
        },
      });

      // Copy scene schedules (package override > film default)
      if (pf.film?.scenes) {
        for (const scene of pf.film.scenes) {
          const pkgSchedule = pf.scene_schedules.find(s => s.scene_id === scene.id);
          const filmSchedule = scene.schedule;
          const source = pkgSchedule || filmSchedule;

          if (source) {
            const eventDayTemplateId = source.event_day_template_id;
            const projectEventDayId = eventDayTemplateId
              ? eventDayMap.get(eventDayTemplateId) ?? null
              : null;

            await this.prisma.projectFilmSceneSchedule.create({
              data: {
                project_film_id: projectFilm.id,
                scene_id: scene.id,
                project_event_day_id: projectEventDayId,
                scheduled_start_time: source.scheduled_start_time,
                scheduled_duration_minutes: source.scheduled_duration_minutes,
                moment_schedules: source.moment_schedules ?? undefined,
                beat_schedules: source.beat_schedules ?? undefined,
                notes: source.notes,
                order_index: scene.order_index,
                is_locked: false,
              },
            });
          }
        }
      }

      createdProjectFilms.push(projectFilm);
    }

    // 5. Copy PackageActivity records → ProjectActivity
    // Build a mapping from PackageEventDay.id → ProjectEventDay.id
    const packageEventDays = await this.prisma.packageEventDay.findMany({
      where: { package_id: packageId },
    });
    const pedToProjectDay = new Map<number, number>(); // PackageEventDay.id → ProjectEventDay.id
    for (const ped of packageEventDays) {
      const projDayId = eventDayMap.get(ped.event_day_template_id);
      if (projDayId) {
        pedToProjectDay.set(ped.id, projDayId);
      }
    }

    const packageActivities = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId },
      orderBy: { order_index: 'asc' },
    });

    let activitiesCopied = 0;
    for (const pa of packageActivities) {
      const projectEventDayId = pedToProjectDay.get(pa.package_event_day_id);
      if (!projectEventDayId) continue; // Day not mapped to project, skip

      await this.prisma.projectActivity.create({
        data: {
          project_id: projectId,
          project_event_day_id: projectEventDayId,
          package_activity_id: pa.id,
          name: pa.name,
          description: pa.description,
          color: pa.color,
          icon: pa.icon,
          start_time: pa.start_time,
          end_time: pa.end_time,
          duration_minutes: pa.duration_minutes,
          order_index: pa.order_index,
          is_locked: false,
        },
      });
      activitiesCopied++;
    }

    return {
      project_id: projectId,
      event_days_created: eventDayMap.size - existingTemplateIds.size,
      films_created: createdProjectFilms.length,
      activities_copied: activitiesCopied,
      project_films: createdProjectFilms,
    };
  }

  /**
   * Returns the "resolved" schedule for a film, merging defaults at each level.
   * Priority: Project overrides → Package overrides → Film defaults
   */
  async getResolvedSchedule(params: {
    filmId: number;
    packageFilmId?: number;
    projectFilmId?: number;
  }) {
    const { filmId, packageFilmId, projectFilmId } = params;

    // Get film with scenes and film-level schedules
    const film = await this.prisma.film.findUnique({
      where: { id: filmId },
      include: {
        scenes: {
          orderBy: { order_index: 'asc' },
          include: {
            moments: { orderBy: { order_index: 'asc' } },
            beats: { orderBy: { order_index: 'asc' } },
            schedule: { include: { event_day: true } },
          },
        },
      },
    });

    if (!film) throw new NotFoundException('Film not found');

    // Get package-level overrides if applicable
    let packageSchedules: any[] = [];
    if (packageFilmId) {
      packageSchedules = await this.prisma.packageFilmSceneSchedule.findMany({
        where: { package_film_id: packageFilmId },
        include: { event_day: true },
      });
    }

    // Get project-level overrides if applicable
    let projectSchedules: any[] = [];
    if (projectFilmId) {
      projectSchedules = await this.prisma.projectFilmSceneSchedule.findMany({
        where: { project_film_id: projectFilmId },
        include: { project_event_day: true },
      });
    }

    // Merge: for each scene, resolve the schedule from the highest priority level
    const resolvedScenes = film.scenes.map((scene) => {
      const filmDefault = scene.schedule;
      const packageOverride = packageSchedules.find(s => s.scene_id === scene.id);
      const projectOverride = projectSchedules.find(s => s.scene_id === scene.id);

      // Project > Package > Film defaults
      const resolved = {
        scene_id: scene.id,
        scene_name: scene.name,
        scene_mode: scene.mode,
        order_index: scene.order_index,
        // Edit duration (from the scene itself)
        edit_duration_seconds: scene.duration_seconds,
        // Resolved schedule fields
        event_day: projectOverride?.project_event_day
          ?? packageOverride?.event_day
          ?? filmDefault?.event_day
          ?? null,
        scheduled_start_time:
          projectOverride?.scheduled_start_time
          ?? packageOverride?.scheduled_start_time
          ?? filmDefault?.scheduled_start_time
          ?? null,
        scheduled_duration_minutes:
          projectOverride?.scheduled_duration_minutes
          ?? packageOverride?.scheduled_duration_minutes
          ?? filmDefault?.scheduled_duration_minutes
          ?? null,
        moment_schedules:
          projectOverride?.moment_schedules
          ?? packageOverride?.moment_schedules
          ?? filmDefault?.moment_schedules
          ?? null,
        beat_schedules:
          projectOverride?.beat_schedules
          ?? packageOverride?.beat_schedules
          ?? filmDefault?.beat_schedules
          ?? null,
        notes:
          projectOverride?.notes
          ?? packageOverride?.notes
          ?? filmDefault?.notes
          ?? null,
        is_locked: projectOverride?.is_locked ?? false,
        // Source tracking: which level provided the data
        source: projectOverride ? 'project'
          : packageOverride ? 'package'
          : filmDefault ? 'film'
          : 'none',
        // Raw data from each level (for override detection)
        film_default: filmDefault,
        package_override: packageOverride,
        project_override: projectOverride,
        // Child items
        moments: scene.moments,
        beats: scene.beats,
      };

      return resolved;
    });

    return {
      film_id: film.id,
      film_name: film.name,
      scenes: resolvedScenes,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Instance-Level CRUD (dual-owner: project OR inquiry)
  // ═══════════════════════════════════════════════════════════════════════
  //
  // These methods operate on the Project* tables which support dual ownership.
  // An InstanceOwner is either { project_id: number } or { inquiry_id: number }.
  // The existing project-specific methods are kept as wrappers for
  // backward compatibility; new inquiry endpoints call these directly.
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Instance Event Days ─────────────────────────────────────────────

  async getInstanceEventDays(owner: InstanceOwner) {
    return this.prisma.projectEventDay.findMany({
      where: { ...owner },
      include: {
        event_day_template: true,
        activities: { orderBy: { order_index: 'asc' } },
        day_operators: { orderBy: { order_index: 'asc' } },
        subjects: { orderBy: { order_index: 'asc' } },
        location_slots: { orderBy: { location_number: 'asc' } },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createInstanceEventDay(owner: InstanceOwner, dto: CreateProjectEventDayDto) {
    return this.prisma.projectEventDay.create({
      data: {
        ...owner,
        event_day_template_id: dto.event_day_template_id,
        name: dto.name,
        date: new Date(dto.date),
        start_time: dto.start_time,
        end_time: dto.end_time,
        order_index: dto.order_index ?? 0,
        notes: dto.notes,
      },
      include: { event_day_template: true },
    });
  }

  // update/delete by ID — reuse existing methods (no owner needed)
  // updateProjectEventDay and deleteProjectEventDay already work for both owners

  // ─── Instance Activities ─────────────────────────────────────────────

  private readonly instanceActivityInclude = {
    package_activity: true,
    moments: { orderBy: { order_index: 'asc' as const } },
    operators: { orderBy: { order_index: 'asc' as const } },
    subjects: { orderBy: { order_index: 'asc' as const } },
    location_slots: { orderBy: { location_number: 'asc' as const } },
    scene_schedules: true,
  };

  async getInstanceActivities(owner: InstanceOwner, projectEventDayId: number) {
    return this.prisma.projectActivity.findMany({
      where: { ...owner, project_event_day_id: projectEventDayId },
      include: this.instanceActivityInclude,
      orderBy: { order_index: 'asc' },
    });
  }

  async getInstanceAllActivities(owner: InstanceOwner) {
    return this.prisma.projectActivity.findMany({
      where: { ...owner },
      include: this.instanceActivityInclude,
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createInstanceActivity(owner: InstanceOwner, dto: CreateProjectActivityDto) {
    return this.prisma.projectActivity.create({
      data: {
        ...owner,
        project_event_day_id: dto.project_event_day_id,
        package_activity_id: dto.package_activity_id,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        start_time: dto.start_time,
        end_time: dto.end_time,
        duration_minutes: dto.duration_minutes,
        order_index: dto.order_index ?? 0,
        notes: dto.notes,
      },
      include: this.instanceActivityInclude,
    });
  }

  // update/delete by ID — reuse existing updateProjectActivity / deleteProjectActivity

  // ─── Instance Activity Moments ───────────────────────────────────────

  private readonly instanceMomentInclude = {
    project_activity: true,
  };

  async getInstanceActivityMoments(activityId: number) {
    return this.prisma.projectActivityMoment.findMany({
      where: { project_activity_id: activityId },
      include: this.instanceMomentInclude,
      orderBy: { order_index: 'asc' },
    });
  }

  async createInstanceActivityMoment(owner: InstanceOwner, dto: CreateInstanceActivityMomentDto) {
    // Auto-assign next order index
    const existing = await this.prisma.projectActivityMoment.findMany({
      where: { project_activity_id: dto.project_activity_id },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    return this.prisma.projectActivityMoment.create({
      data: {
        ...owner,
        project_activity_id: dto.project_activity_id,
        name: dto.name,
        order_index: dto.order_index ?? nextOrder,
        duration_seconds: dto.duration_seconds ?? 60,
        is_required: dto.is_required ?? true,
        notes: dto.notes,
      },
      include: this.instanceMomentInclude,
    });
  }

  async updateInstanceActivityMoment(momentId: number, dto: UpdateInstanceActivityMomentDto) {
    const record = await this.prisma.projectActivityMoment.findUnique({ where: { id: momentId } });
    if (!record) throw new NotFoundException('Activity moment not found');

    return this.prisma.projectActivityMoment.update({
      where: { id: momentId },
      data: dto,
      include: this.instanceMomentInclude,
    });
  }

  async deleteInstanceActivityMoment(momentId: number) {
    const record = await this.prisma.projectActivityMoment.findUnique({ where: { id: momentId } });
    if (!record) throw new NotFoundException('Activity moment not found');
    return this.prisma.projectActivityMoment.delete({ where: { id: momentId } });
  }

  async reorderInstanceActivityMoments(activityId: number, momentIds: number[]) {
    const updates = momentIds.map((id, index) =>
      this.prisma.projectActivityMoment.update({
        where: { id },
        data: { order_index: index },
      }),
    );
    await this.prisma.$transaction(updates);
    return this.getInstanceActivityMoments(activityId);
  }

  // ─── Instance Event Day Subjects ─────────────────────────────────────

  private readonly instanceSubjectInclude = {
    role_template: true,
    project_activity: true,
    project_event_day: true,
    activity_assignments: { include: { project_activity: true } },
  };

  async getInstanceEventDaySubjects(owner: InstanceOwner, eventDayId?: number) {
    return this.prisma.projectEventDaySubject.findMany({
      where: {
        ...owner,
        ...(eventDayId ? { project_event_day_id: eventDayId } : {}),
      },
      include: this.instanceSubjectInclude,
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createInstanceEventDaySubject(owner: InstanceOwner, dto: CreateInstanceEventDaySubjectDto) {
    // Auto-assign next order index
    const existing = await this.prisma.projectEventDaySubject.findMany({
      where: { ...owner, project_event_day_id: dto.project_event_day_id },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    return this.prisma.projectEventDaySubject.create({
      data: {
        ...owner,
        project_event_day_id: dto.project_event_day_id,
        project_activity_id: dto.project_activity_id,
        role_template_id: dto.role_template_id,
        name: dto.name,
        real_name: dto.real_name,
        count: dto.count,
        category: dto.category ?? 'PEOPLE',
        notes: dto.notes,
        order_index: dto.order_index ?? nextOrder,
      },
      include: this.instanceSubjectInclude,
    });
  }

  async updateInstanceEventDaySubject(subjectId: number, dto: UpdateInstanceEventDaySubjectDto) {
    const record = await this.prisma.projectEventDaySubject.findUnique({ where: { id: subjectId } });
    if (!record) throw new NotFoundException('Event day subject not found');

    // Build Prisma-compatible data: convert member_names null → Prisma.DbNull
    // so it satisfies the Json? column's NullableJsonNullValueInput type.
    const { member_names, ...rest } = dto;
    const data: Prisma.ProjectEventDaySubjectUncheckedUpdateInput = {
      ...rest,
      ...(member_names !== undefined && {
        member_names: member_names === null ? Prisma.DbNull : member_names,
      }),
    };

    return this.prisma.projectEventDaySubject.update({
      where: { id: subjectId },
      data,
      include: this.instanceSubjectInclude,
    });
  }

  async deleteInstanceEventDaySubject(subjectId: number) {
    const record = await this.prisma.projectEventDaySubject.findUnique({ where: { id: subjectId } });
    if (!record) throw new NotFoundException('Event day subject not found');
    return this.prisma.projectEventDaySubject.delete({ where: { id: subjectId } });
  }

  async assignInstanceSubjectToActivity(subjectId: number, activityId: number) {
    const existing = await this.prisma.projectEventDaySubject.findUnique({ where: { id: subjectId } });
    if (!existing) throw new NotFoundException('Event day subject not found');

    try {
      await this.prisma.projectSubjectActivityAssignment.create({
        data: {
          project_event_day_subject_id: subjectId,
          project_activity_id: activityId,
        },
      });
    } catch {
      // Already assigned — ignore
    }

    return this.prisma.projectEventDaySubject.findUnique({
      where: { id: subjectId },
      include: this.instanceSubjectInclude,
    });
  }

  async unassignInstanceSubjectFromActivity(subjectId: number, activityId: number) {
    const existing = await this.prisma.projectEventDaySubject.findUnique({ where: { id: subjectId } });
    if (!existing) throw new NotFoundException('Event day subject not found');

    await this.prisma.projectSubjectActivityAssignment.deleteMany({
      where: {
        project_event_day_subject_id: subjectId,
        project_activity_id: activityId,
      },
    });

    return this.prisma.projectEventDaySubject.findUnique({
      where: { id: subjectId },
      include: this.instanceSubjectInclude,
    });
  }

  // ─── Instance Location Slots ─────────────────────────────────────────

  private readonly instanceLocationSlotInclude = {
    project_event_day: true,
    project_activity: true,
    location: true,
    activity_assignments: { include: { project_activity: true } },
  };

  async getInstanceLocationSlots(owner: InstanceOwner, eventDayId?: number) {
    return this.prisma.projectLocationSlot.findMany({
      where: {
        ...owner,
        ...(eventDayId ? { project_event_day_id: eventDayId } : {}),
      },
      include: this.instanceLocationSlotInclude,
      orderBy: { location_number: 'asc' },
    });
  }

  async createInstanceLocationSlot(owner: InstanceOwner, dto: CreateInstanceLocationSlotDto) {
    let locationNumber = dto.location_number;

    if (!locationNumber) {
      // Auto-assign next available number 1-5
      const existing = await this.prisma.projectLocationSlot.findMany({
        where: { ...owner, project_event_day_id: dto.project_event_day_id },
        select: { location_number: true },
        orderBy: { location_number: 'asc' },
      });
      const usedNumbers = new Set(existing.map((s) => s.location_number));
      for (let i = 1; i <= 5; i++) {
        if (!usedNumbers.has(i)) {
          locationNumber = i;
          break;
        }
      }
      if (!locationNumber) {
        throw new BadRequestException('Maximum of 5 location slots per event day');
      }
    }

    if (locationNumber < 1 || locationNumber > 5) {
      throw new BadRequestException('Location number must be between 1 and 5');
    }

    try {
      return await this.prisma.projectLocationSlot.create({
        data: {
          ...owner,
          project_event_day_id: dto.project_event_day_id,
          location_number: locationNumber,
          name: dto.name,
          address: dto.address,
          location_id: dto.location_id,
          notes: dto.notes,
        },
        include: this.instanceLocationSlotInclude,
      });
    } catch {
      throw new BadRequestException(
        `Location ${locationNumber} already exists for this event day`,
      );
    }
  }

  async updateInstanceLocationSlot(slotId: number, dto: { name?: string | null; address?: string | null; notes?: string | null }) {
    const record = await this.prisma.projectLocationSlot.findUnique({ where: { id: slotId } });
    if (!record) throw new NotFoundException('Location slot not found');
    return this.prisma.projectLocationSlot.update({
      where: { id: slotId },
      data: dto,
      include: this.instanceLocationSlotInclude,
    });
  }

  async deleteInstanceLocationSlot(slotId: number) {
    const record = await this.prisma.projectLocationSlot.findUnique({ where: { id: slotId } });
    if (!record) throw new NotFoundException('Location slot not found');
    return this.prisma.projectLocationSlot.delete({ where: { id: slotId } });
  }

  async assignInstanceLocationSlotToActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.projectLocationSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Location slot not found');

    try {
      await this.prisma.projectLocationActivityAssignment.create({
        data: {
          project_location_slot_id: slotId,
          project_activity_id: activityId,
        },
      });
    } catch {
      // Already assigned — ignore
    }

    return this.prisma.projectLocationSlot.findUnique({
      where: { id: slotId },
      include: this.instanceLocationSlotInclude,
    });
  }

  async unassignInstanceLocationSlotFromActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.projectLocationSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Location slot not found');

    await this.prisma.projectLocationActivityAssignment.deleteMany({
      where: {
        project_location_slot_id: slotId,
        project_activity_id: activityId,
      },
    });

    return this.prisma.projectLocationSlot.findUnique({
      where: { id: slotId },
      include: this.instanceLocationSlotInclude,
    });
  }

  // ─── Instance Day Operators (Crew Slots) ─────────────────────────────

  private readonly instanceOperatorInclude = {
    contributor: {
      include: {
        contact: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        contributor_job_roles: {
          include: {
            job_role: { select: { id: true, name: true, display_name: true } },
            payment_bracket: {
              select: { id: true, name: true, display_name: true, level: true, hourly_rate: true, day_rate: true },
            },
          },
        },
      },
    },
    job_role: { select: { id: true, name: true, display_name: true, category: true } },
    equipment: { include: { equipment: true } },
    project_event_day: true,
    project_activity: true,
    activity_assignments: { include: { project_activity: true } },
  };

  async getInstanceDayOperators(owner: InstanceOwner, eventDayId?: number) {
    return this.prisma.projectDayOperator.findMany({
      where: {
        ...owner,
        ...(eventDayId ? { project_event_day_id: eventDayId } : {}),
      },
      include: this.instanceOperatorInclude,
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createInstanceDayOperator(owner: InstanceOwner, dto: CreateInstanceDayOperatorDto) {
    // If contributor_id is provided, verify they exist
    if (dto.contributor_id) {
      const contributor = await this.prisma.contributors.findUnique({
        where: { id: dto.contributor_id },
      });
      if (!contributor) throw new NotFoundException('Crew member not found');
    }

    const maxOrder = await this.prisma.projectDayOperator.aggregate({
      where: { ...owner, project_event_day_id: dto.project_event_day_id },
      _max: { order_index: true },
    });

    return this.prisma.projectDayOperator.create({
      data: {
        ...owner,
        project_event_day_id: dto.project_event_day_id,
        position_name: dto.position_name,
        position_color: dto.position_color ?? null,
        contributor_id: dto.contributor_id ?? null,
        job_role_id: dto.job_role_id ?? null,
        hours: dto.hours ?? 8,
        notes: dto.notes ?? null,
        order_index: (maxOrder._max.order_index ?? -1) + 1,
        project_activity_id: dto.project_activity_id ?? null,
      },
      include: this.instanceOperatorInclude,
    }).then(async (created) => {
      // Auto-assign unassigned inquiry tasks when crew is created with contributor
      if (owner.inquiry_id && dto.job_role_id && dto.contributor_id) {
        await this.inquiryTasksService.autoAssignByRole(
          owner.inquiry_id,
          dto.job_role_id,
          dto.contributor_id,
        );
      }
      return created;
    });
  }

  async updateInstanceDayOperator(operatorId: number, dto: UpdateInstanceDayOperatorDto) {
    const existing = await this.prisma.projectDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    await this.prisma.projectDayOperator.update({
      where: { id: operatorId },
      data: {
        position_name: dto.position_name ?? undefined,
        position_color: dto.position_color !== undefined ? dto.position_color : undefined,
        contributor_id: dto.contributor_id !== undefined ? dto.contributor_id : undefined,
        job_role_id: dto.job_role_id !== undefined ? dto.job_role_id : undefined,
        hours: dto.hours ?? undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        order_index: dto.order_index ?? undefined,
        project_activity_id: dto.project_activity_id !== undefined ? dto.project_activity_id : undefined,
      },
    });

    // Auto-assign inquiry tasks if crew member was set/changed on an inquiry operator
    if (existing.inquiry_id && dto.contributor_id) {
      const jobRoleId = dto.job_role_id !== undefined ? dto.job_role_id : existing.job_role_id;
      if (jobRoleId) {
        await this.inquiryTasksService.autoAssignByRole(
          existing.inquiry_id,
          jobRoleId,
          dto.contributor_id,
        );
      }
    }

    return this.prisma.projectDayOperator.findUnique({
      where: { id: operatorId },
      include: this.instanceOperatorInclude,
    });
  }

  async assignInstanceCrewToSlot(operatorId: number, contributorId: number | null) {
    const existing = await this.prisma.projectDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    if (contributorId) {
      const contributor = await this.prisma.contributors.findUnique({ where: { id: contributorId } });
      if (!contributor) throw new NotFoundException('Crew member not found');
    }

    await this.prisma.projectDayOperator.update({
      where: { id: operatorId },
      data: { contributor_id: contributorId },
    });

    // Crew assignment affects estimate costs — mark review_estimate subtask incomplete (stale)
    if (existing.inquiry_id) {
      await this.inquiryTasksService.setAutoSubtaskStatus(existing.inquiry_id, 'review_estimate', false);
    }

    // Auto-assign unassigned inquiry tasks that match this operator's role
    if (existing.inquiry_id && existing.job_role_id && contributorId) {
      await this.inquiryTasksService.autoAssignByRole(
        existing.inquiry_id,
        existing.job_role_id,
        contributorId,
      );
    }

    return this.prisma.projectDayOperator.findUnique({
      where: { id: operatorId },
      include: this.instanceOperatorInclude,
    });
  }

  async removeInstanceDayOperator(operatorId: number) {
    const existing = await this.prisma.projectDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');
    return this.prisma.projectDayOperator.delete({ where: { id: operatorId } });
  }

  async setInstanceOperatorEquipment(
    operatorId: number,
    equipmentIds: { equipment_id: number; is_primary: boolean }[],
  ) {
    const existing = await this.prisma.projectDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    await this.prisma.projectDayOperatorEquipment.deleteMany({
      where: { project_day_operator_id: operatorId },
    });

    if (equipmentIds.length > 0) {
      await this.prisma.projectDayOperatorEquipment.createMany({
        data: equipmentIds.map((eq) => ({
          project_day_operator_id: operatorId,
          equipment_id: eq.equipment_id,
          is_primary: eq.is_primary,
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.projectDayOperator.findUnique({
      where: { id: operatorId },
      include: this.instanceOperatorInclude,
    });
  }

  async assignInstanceOperatorToActivity(operatorId: number, activityId: number) {
    const existing = await this.prisma.projectDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    try {
      await this.prisma.projectOperatorActivityAssignment.create({
        data: {
          project_day_operator_id: operatorId,
          project_activity_id: activityId,
        },
      });
    } catch {
      // Already assigned — ignore
    }

    return this.prisma.projectDayOperator.findUnique({
      where: { id: operatorId },
      include: this.instanceOperatorInclude,
    });
  }

  async unassignInstanceOperatorFromActivity(operatorId: number, activityId: number) {
    const existing = await this.prisma.projectDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    await this.prisma.projectOperatorActivityAssignment.deleteMany({
      where: {
        project_day_operator_id: operatorId,
        project_activity_id: activityId,
      },
    });

    return this.prisma.projectDayOperator.findUnique({
      where: { id: operatorId },
      include: this.instanceOperatorInclude,
    });
  }

  // ─── Instance Films (inquiry support) ────────────────────────────────

  async getInstanceFilms(owner: InstanceOwner) {
    return this.prisma.projectFilm.findMany({
      where: { ...owner },
      include: {
        film: {
          include: {
            scenes: {
              orderBy: { order_index: 'asc' },
              include: {
                moments: { orderBy: { order_index: 'asc' } },
                beats: { orderBy: { order_index: 'asc' } },
              },
            },
          },
        },
        package_film: true,
        scene_schedules: {
          include: {
            scene: true,
            project_event_day: true,
          },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createInstanceFilm(owner: InstanceOwner, dto: CreateProjectFilmDto) {
    return this.prisma.projectFilm.create({
      data: {
        ...owner,
        film_id: dto.film_id,
        package_film_id: dto.package_film_id,
        order_index: dto.order_index ?? 0,
      },
      include: {
        film: { include: { scenes: { orderBy: { order_index: 'asc' } } } },
        package_film: true,
      },
    });
  }

  // deleteProjectFilm, upsertProjectFilmSceneSchedule etc. work by ID — reusable for inquiry

  // ─── Schedule Diff (instance vs source package) ──────────────────────

  /**
   * Compare the current instance schedule against the source package schedule.
   * Returns a structured diff showing added/removed/modified entities.
   */
  async getScheduleDiff(owner: InstanceOwner) {
    // 1. Determine owner ID and type
    const isProject = 'project_id' in owner && owner.project_id != null;
    const ownerId = isProject ? owner.project_id : owner.inquiry_id;

    // 2. Get source package ID from the owner record
    let sourcePackageId: number | null = null;
    if (isProject) {
      const project = await this.prisma.projects.findUnique({
        where: { id: ownerId! },
        select: { source_package_id: true },
      });
      if (!project) throw new NotFoundException(`Project ${ownerId} not found`);
      sourcePackageId = project.source_package_id;
    } else {
      const inquiry = await this.prisma.inquiries.findUnique({
        where: { id: ownerId! },
        select: { source_package_id: true },
      });
      if (!inquiry) throw new NotFoundException(`Inquiry ${ownerId} not found`);
      sourcePackageId = inquiry.source_package_id;
    }

    if (!sourcePackageId) {
      return {
        has_source_package: false,
        source_package_id: null,
        diffs: { event_days: [], activities: [], subjects: [], operators: [], location_slots: [] },
        summary: { total_changes: 0, added: 0, removed: 0, modified: 0 },
      };
    }

    // 3. Fetch current instance data
    const [instanceDays, instanceActivities, instanceSubjects, instanceOperators, instanceSlots] =
      await Promise.all([
        this.prisma.projectEventDay.findMany({
          where: owner,
          include: { event_day_template: { select: { id: true, name: true } } },
          orderBy: { order_index: 'asc' },
        }),
        this.prisma.projectActivity.findMany({
          where: owner,
          include: {
            project_event_day: { select: { id: true, name: true, event_day_template_id: true } },
          },
          orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
        }),
        this.prisma.projectEventDaySubject.findMany({
          where: owner,
          include: { role_template: { select: { id: true, role_name: true } } },
          orderBy: { order_index: 'asc' },
        }),
        this.prisma.projectDayOperator.findMany({
          where: owner,
          include: { job_role: { select: { id: true, name: true, display_name: true } } },
          orderBy: { order_index: 'asc' },
        }),
        this.prisma.projectLocationSlot.findMany({
          where: owner,
          orderBy: { order_index: 'asc' },
        }),
      ]);

    // 4. Fetch source package data
    const [pkgDays, pkgActivities, pkgSubjects, pkgOperators, pkgSlots] =
      await Promise.all([
        this.prisma.packageEventDay.findMany({
          where: { package_id: sourcePackageId },
          include: { event_day: { select: { id: true, name: true } } },
          orderBy: { order_index: 'asc' },
        }),
        this.prisma.packageActivity.findMany({
          where: { package_id: sourcePackageId },
          include: {
            package_event_day: {
              select: { id: true, event_day_template_id: true, event_day: { select: { name: true } } },
            },
          },
          orderBy: [{ package_event_day_id: 'asc' }, { order_index: 'asc' }],
        }),
        this.prisma.packageEventDaySubject.findMany({
          where: { package_id: sourcePackageId },
          include: { role_template: { select: { id: true, role_name: true } } },
          orderBy: { order_index: 'asc' },
        }),
        this.prisma.packageDayOperator.findMany({
          where: { package_id: sourcePackageId },
          include: { job_role: { select: { id: true, name: true, display_name: true } } },
          orderBy: { order_index: 'asc' },
        }),
        this.prisma.packageLocationSlot.findMany({
          where: { package_id: sourcePackageId },
          orderBy: { location_number: 'asc' },
        }),
      ]);

    // 5. Build diffs

    // Event days diff (match by event_day_template_id)
    const pkgDayTemplateIds = new Set(pkgDays.map((d) => d.event_day_template_id));
    const instDayTemplateIds = new Set(instanceDays.map((d) => d.event_day_template_id));
    const eventDayDiffs = [
      ...pkgDays
        .filter((d) => !instDayTemplateIds.has(d.event_day_template_id))
        .map((d) => ({
          change: 'removed' as const,
          name: d.event_day?.name ?? `Day ${d.order_index + 1}`,
          template_id: d.event_day_template_id,
        })),
      // Instance days linked to a template not present in the package
      ...instanceDays
        .filter((d) => d.event_day_template_id != null && !pkgDayTemplateIds.has(d.event_day_template_id!))
        .map((d) => ({
          change: 'added' as const,
          name: d.event_day_template?.name ?? d.name ?? `Day ${d.order_index + 1}`,
          template_id: d.event_day_template_id,
        })),
      // Custom instance days with no template link (user-created, always "added")
      ...instanceDays
        .filter((d) => d.event_day_template_id == null)
        .map((d) => ({
          change: 'added' as const,
          name: d.name ?? `Day ${d.order_index + 1}`,
          template_id: null,
        })),
    ];

    // Activities diff (match by package_activity_id traceability link)
    const pkgActivityIds = new Set(pkgActivities.map((a) => a.id));
    const instActivitySourceIds = new Map(
      instanceActivities
        .filter((a) => a.package_activity_id != null)
        .map((a) => [a.package_activity_id!, a]),
    );
    const activityDiffs: Array<{ change: string; name: string; detail?: string }> = [];

    for (const pa of pkgActivities) {
      const inst = instActivitySourceIds.get(pa.id);
      if (!inst) {
        activityDiffs.push({
          change: 'removed',
          name: pa.name,
          detail: `Was in ${pa.package_event_day?.event_day?.name ?? 'Unknown Day'}`,
        });
      } else {
        // Check for modifications
        const changes: string[] = [];
        if (inst.name !== pa.name) changes.push(`name: "${pa.name}" → "${inst.name}"`);
        if (inst.start_time !== pa.start_time) changes.push('start time changed');
        if (inst.end_time !== pa.end_time) changes.push('end time changed');
        if (inst.duration_minutes !== pa.duration_minutes) changes.push('duration changed');
        if (changes.length > 0) {
          activityDiffs.push({ change: 'modified', name: inst.name, detail: changes.join(', ') });
        }
      }
    }
    // Activities without a package_activity_id link were added fresh
    for (const ia of instanceActivities) {
      if (!ia.package_activity_id) {
        activityDiffs.push({ change: 'added', name: ia.name });
      }
    }

    // Subjects diff (match by source_package_subject_id)
    const subjectDiffs: Array<{ change: string; name: string; detail?: string }> = [];
    const instSubjectSourceMap = new Map(
      instanceSubjects
        .filter((s) => s.source_package_subject_id != null)
        .map((s) => [s.source_package_subject_id!, s]),
    );
    for (const ps of pkgSubjects) {
      const inst = instSubjectSourceMap.get(ps.id);
      if (!inst) {
        subjectDiffs.push({ change: 'removed', name: ps.name ?? ps.role_template?.role_name ?? 'Unknown' });
      } else {
        // Check for modifications
        const changes: string[] = [];
        const pkgName = ps.name ?? ps.role_template?.role_name ?? '';
        const instName = inst.name ?? inst.role_template?.role_name ?? '';
        if (instName !== pkgName) changes.push(`name: "${pkgName}" → "${instName}"`);
        if (changes.length > 0) {
          subjectDiffs.push({ change: 'modified', name: instName || pkgName, detail: changes.join(', ') });
        }
      }
    }
    for (const is_ of instanceSubjects) {
      if (!is_.source_package_subject_id) {
        subjectDiffs.push({ change: 'added', name: is_.name ?? is_.role_template?.role_name ?? 'Unknown' });
      }
    }

    // Operators diff (match by source_package_operator_id)
    const operatorDiffs: Array<{ change: string; name: string; detail?: string }> = [];
    const instOpSourceMap = new Map(
      instanceOperators
        .filter((o) => o.source_package_operator_id != null)
        .map((o) => [o.source_package_operator_id!, o]),
    );
    for (const po of pkgOperators) {
      const inst = instOpSourceMap.get(po.id);
      if (!inst) {
        operatorDiffs.push({
          change: 'removed',
          name: po.position_name ?? po.job_role?.display_name ?? po.job_role?.name ?? 'Unknown',
        });
      } else {
        // Check for modifications
        const changes: string[] = [];
        const pkgName = po.position_name ?? po.job_role?.display_name ?? po.job_role?.name ?? '';
        const instName = inst.position_name ?? inst.job_role?.display_name ?? inst.job_role?.name ?? '';
        if (instName !== pkgName) changes.push(`position: "${pkgName}" → "${instName}"`);
        if (inst.job_role_id !== po.job_role_id) changes.push('role changed');
        if (changes.length > 0) {
          operatorDiffs.push({ change: 'modified', name: instName || pkgName, detail: changes.join(', ') });
        }
      }
    }
    for (const io of instanceOperators) {
      if (!io.source_package_operator_id) {
        operatorDiffs.push({
          change: 'added',
          name: io.position_name ?? io.job_role?.display_name ?? io.job_role?.name ?? 'Unknown',
        });
      }
    }

    // Location slots diff (match by source_package_location_slot_id)
    const locationDiffs: Array<{ change: string; name: string }> = [];
    const instLocSourceIds = new Set(
      instanceSlots.filter((l) => l.source_package_location_slot_id != null).map((l) => l.source_package_location_slot_id),
    );
    for (const pl of pkgSlots) {
      if (!instLocSourceIds.has(pl.id)) {
        locationDiffs.push({ change: 'removed', name: `Location ${pl.location_number}` });
      }
    }
    for (const il of instanceSlots) {
      if (!il.source_package_location_slot_id) {
        locationDiffs.push({ change: 'added', name: il.name ?? `Location ${il.location_number}` });
      }
    }

    // 6. Summary
    const allDiffs = [
      ...eventDayDiffs, ...activityDiffs, ...subjectDiffs, ...operatorDiffs, ...locationDiffs,
    ];
    const added = allDiffs.filter((d) => d.change === 'added').length;
    const removed = allDiffs.filter((d) => d.change === 'removed').length;
    const modified = allDiffs.filter((d) => d.change === 'modified').length;

    return {
      has_source_package: true,
      source_package_id: sourcePackageId,
      counts: {
        package: {
          event_days: pkgDays.length,
          activities: pkgActivities.length,
          subjects: pkgSubjects.length,
          operators: pkgOperators.length,
          location_slots: pkgSlots.length,
        },
        instance: {
          event_days: instanceDays.length,
          activities: instanceActivities.length,
          subjects: instanceSubjects.length,
          operators: instanceOperators.length,
          location_slots: instanceSlots.length,
        },
      },
      diffs: {
        event_days: eventDayDiffs,
        activities: activityDiffs,
        subjects: subjectDiffs,
        operators: operatorDiffs,
        location_slots: locationDiffs,
      },
      summary: {
        total_changes: added + removed + modified,
        added,
        removed,
        modified,
      },
    };
  }
}
