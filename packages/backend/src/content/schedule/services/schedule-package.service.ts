import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  AddPackageEventDayDto,
  SetPackageEventDaysDto,
  CreatePackageFilmDto,
  UpdatePackageFilmDto,
  UpsertPackageFilmSceneScheduleDto,
} from '../dto';

@Injectable()
export class SchedulePackageService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Package Schedule Summary ──────────────────────────────────────

  async getPackageScheduleSummary(packageId: number) {
    const pkg = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { id: true, name: true, description: true },
    });
    if (!pkg) throw new NotFoundException(`Package ${packageId} not found`);

    const [eventDayCount, activityCount, momentCount, subjectCount, locationSlotCount, operatorCount, filmCount, eventDays] =
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
      counts: { event_days: eventDayCount, activities: activityCount, moments: momentCount, subjects: subjectCount, location_slots: locationSlotCount, operators: operatorCount, films: filmCount },
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
   * Auto-populate SceneMoment records from PackageActivityMoment records.
   * Only creates moments if the scene doesn't already have any.
   * Does NOT auto-populate for MONTAGE scenes.
   */
  private async autoPopulateSceneMomentsFromActivity(sceneId: number, activityId: number) {
    const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
    if (!scene || scene.mode === 'MONTAGE') return;

    const existingMoments = await this.prisma.sceneMoment.count({ where: { film_scene_id: sceneId } });
    if (existingMoments > 0) return;

    const activityMoments = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'asc' },
    });
    if (activityMoments.length === 0) return;

    await this.prisma.sceneMoment.createMany({
      data: activityMoments.map((am) => ({
        film_scene_id: sceneId,
        name: am.name,
        order_index: am.order_index,
        duration: am.duration_seconds,
      })),
    });
  }
}
