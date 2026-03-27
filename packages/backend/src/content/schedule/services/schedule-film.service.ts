import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  CreateFilmSceneScheduleDto,
  UpdateFilmSceneScheduleDto,
  BulkUpsertFilmSceneScheduleDto,
} from '../dto';

@Injectable()
export class ScheduleFilmService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Film Scene Schedules (Library-level) ────────────────────────────

  async getFilmSchedule(filmId: number) {
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
    const results: Awaited<ReturnType<typeof this.upsertFilmSceneSchedule>>[] = [];
    for (const dto of schedules) {
      const result = await this.upsertFilmSceneSchedule(filmId, {
        scene_id: dto.scene_id,
        event_day_template_id: dto.event_day_template_id ?? undefined,
        scheduled_start_time: dto.scheduled_start_time ?? undefined,
        scheduled_duration_minutes: dto.scheduled_duration_minutes ?? undefined,
        moment_schedules: dto.moment_schedules ?? undefined,
        beat_schedules: dto.beat_schedules ?? undefined,
        notes: dto.notes ?? undefined,
        order_index: dto.order_index,
      });
      results.push(result);
    }
    return results;
  }

  async updateFilmSceneSchedule(scheduleId: number, dto: UpdateFilmSceneScheduleDto) {
    const existing = await this.prisma.filmSceneSchedule.findUnique({ where: { id: scheduleId } });
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
    const existing = await this.prisma.filmSceneSchedule.findUnique({ where: { id: scheduleId } });
    if (!existing) throw new NotFoundException('Film scene schedule not found');
    return this.prisma.filmSceneSchedule.delete({ where: { id: scheduleId } });
  }

  // ─── Resolved Schedule (inheritance chain) ───────────────────────────

  async getResolvedSchedule(params: {
    filmId: number;
    packageFilmId?: number;
    projectFilmId?: number;
  }) {
    const { filmId, packageFilmId, projectFilmId } = params;

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

    const packageSchedules = packageFilmId
      ? await this.prisma.packageFilmSceneSchedule.findMany({
          where: { package_film_id: packageFilmId },
          include: { event_day: true },
        })
      : [];

    const projectSchedules = projectFilmId
      ? await this.prisma.projectFilmSceneSchedule.findMany({
          where: { project_film_id: projectFilmId },
          include: { project_event_day: true },
        })
      : [];

    const resolvedScenes = film.scenes.map((scene) =>
      this.resolveSceneSchedule(scene, packageSchedules, projectSchedules),
    );

    return { film_id: film.id, film_name: film.name, scenes: resolvedScenes };
  }

  private resolveSceneSchedule(
    scene: Prisma.FilmSceneGetPayload<{ include: { moments: true; beats: true; schedule: { include: { event_day: true } } } }>,
    packageSchedules: Prisma.PackageFilmSceneScheduleGetPayload<{ include: { event_day: true } }>[],
    projectSchedules: Prisma.ProjectFilmSceneScheduleGetPayload<{ include: { project_event_day: true } }>[],
  ) {
    const filmDefault = scene.schedule;
    const packageOverride = packageSchedules.find((s) => s.scene_id === scene.id);
    const projectOverride = projectSchedules.find((s) => s.scene_id === scene.id);

    return {
      scene_id: scene.id,
      scene_name: scene.name,
      scene_mode: scene.mode,
      order_index: scene.order_index,
      edit_duration_seconds: scene.duration_seconds,
      event_day: projectOverride?.project_event_day ?? packageOverride?.event_day ?? filmDefault?.event_day ?? null,
      scheduled_start_time: projectOverride?.scheduled_start_time ?? packageOverride?.scheduled_start_time ?? filmDefault?.scheduled_start_time ?? null,
      scheduled_duration_minutes: projectOverride?.scheduled_duration_minutes ?? packageOverride?.scheduled_duration_minutes ?? filmDefault?.scheduled_duration_minutes ?? null,
      moment_schedules: projectOverride?.moment_schedules ?? packageOverride?.moment_schedules ?? filmDefault?.moment_schedules ?? null,
      beat_schedules: projectOverride?.beat_schedules ?? packageOverride?.beat_schedules ?? filmDefault?.beat_schedules ?? null,
      notes: projectOverride?.notes ?? packageOverride?.notes ?? filmDefault?.notes ?? null,
      is_locked: projectOverride?.is_locked ?? false,
      source: projectOverride ? 'project' : packageOverride ? 'package' : filmDefault ? 'film' : 'none',
      film_default: filmDefault,
      package_override: packageOverride,
      project_override: projectOverride,
      moments: scene.moments,
      beats: scene.beats,
    };
  }
}
