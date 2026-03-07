import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
} from './dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

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
   */
  private async autoPopulateSceneMomentsFromActivity(
    sceneId: number,
    activityId: number,
  ) {
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
}
