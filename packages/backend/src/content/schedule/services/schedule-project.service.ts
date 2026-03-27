import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectFilm } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  CreateProjectEventDayDto,
  UpdateProjectEventDayDto,
  CreateProjectFilmDto,
  UpsertProjectFilmSceneScheduleDto,
  CreateProjectActivityDto,
  UpdateProjectActivityDto,
} from '../dto';

@Injectable()
export class ScheduleProjectService {
  constructor(private readonly prisma: PrismaService) {}

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
        project_id: projectId, event_day_template_id: dto.event_day_template_id,
        name: dto.name, date: new Date(dto.date), start_time: dto.start_time,
        end_time: dto.end_time, order_index: dto.order_index ?? 0, notes: dto.notes,
      },
      include: { event_day_template: true },
    });
  }

  async updateProjectEventDay(eventDayId: number, dto: UpdateProjectEventDayDto) {
    return this.prisma.projectEventDay.update({
      where: { id: eventDayId },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
      include: { event_day_template: true },
    });
  }

  async deleteProjectEventDay(eventDayId: number) {
    return this.prisma.projectEventDay.delete({ where: { id: eventDayId } });
  }

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
            scene_schedules: { include: { event_day: true } },
          },
        },
        package_film: { include: { scene_schedules: { include: { event_day: true } } } },
        scene_schedules: { include: { project_event_day: true }, orderBy: { order_index: 'asc' } },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createProjectFilm(projectId: number, dto: CreateProjectFilmDto) {
    return this.prisma.projectFilm.create({
      data: { project_id: projectId, film_id: dto.film_id, package_film_id: dto.package_film_id, order_index: dto.order_index ?? 0 },
      include: { film: true },
    });
  }

  async deleteProjectFilm(projectFilmId: number) {
    return this.prisma.projectFilm.delete({ where: { id: projectFilmId } });
  }

  async upsertProjectFilmSceneSchedule(projectFilmId: number, dto: UpsertProjectFilmSceneScheduleDto) {
    return this.prisma.projectFilmSceneSchedule.upsert({
      where: { project_film_id_scene_id: { project_film_id: projectFilmId, scene_id: dto.scene_id } },
      create: {
        project_film_id: projectFilmId, scene_id: dto.scene_id,
        project_activity_id: dto.project_activity_id, project_event_day_id: dto.project_event_day_id,
        scheduled_start_time: dto.scheduled_start_time, scheduled_duration_minutes: dto.scheduled_duration_minutes,
        moment_schedules: dto.moment_schedules ?? undefined, beat_schedules: dto.beat_schedules ?? undefined,
        notes: dto.notes, order_index: dto.order_index ?? 0, is_locked: dto.is_locked ?? false,
      },
      update: {
        project_activity_id: dto.project_activity_id, project_event_day_id: dto.project_event_day_id,
        scheduled_start_time: dto.scheduled_start_time, scheduled_duration_minutes: dto.scheduled_duration_minutes,
        moment_schedules: dto.moment_schedules ?? undefined, beat_schedules: dto.beat_schedules ?? undefined,
        notes: dto.notes, order_index: dto.order_index, is_locked: dto.is_locked,
      },
      include: { project_event_day: true },
    });
  }

  async bulkUpsertProjectFilmSceneSchedules(projectFilmId: number, schedules: UpsertProjectFilmSceneScheduleDto[]) {
    const results: Awaited<ReturnType<typeof this.upsertProjectFilmSceneSchedule>>[] = [];
    for (const dto of schedules) {
      results.push(await this.upsertProjectFilmSceneSchedule(projectFilmId, dto));
    }
    return results;
  }

  // ─── Project Activities ──────────────────────────────────────────────

  async getProjectActivities(projectId: number, projectEventDayId: number) {
    return this.prisma.projectActivity.findMany({
      where: { project_id: projectId, project_event_day_id: projectEventDayId },
      include: {
        package_activity: true,
        scene_schedules: { include: { scene: true, project_film: { include: { film: true } } } },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createProjectActivity(projectId: number, dto: CreateProjectActivityDto) {
    return this.prisma.projectActivity.create({
      data: {
        project_id: projectId, project_event_day_id: dto.project_event_day_id,
        package_activity_id: dto.package_activity_id, name: dto.name,
        description: dto.description, color: dto.color, icon: dto.icon,
        start_time: dto.start_time, end_time: dto.end_time,
        duration_minutes: dto.duration_minutes, order_index: dto.order_index ?? 0, notes: dto.notes,
      },
      include: { package_activity: true },
    });
  }

  async updateProjectActivity(activityId: number, dto: UpdateProjectActivityDto) {
    const existing = await this.prisma.projectActivity.findUnique({ where: { id: activityId } });
    if (!existing) throw new NotFoundException('Project activity not found');
    return this.prisma.projectActivity.update({
      where: { id: activityId }, data: dto,
      include: { package_activity: true },
    });
  }

  async deleteProjectActivity(activityId: number) {
    const existing = await this.prisma.projectActivity.findUnique({ where: { id: activityId } });
    if (!existing) throw new NotFoundException('Project activity not found');
    return this.prisma.projectActivity.delete({ where: { id: activityId } });
  }

  // ─── Initialize Project from Package ─────────────────────────────────

  async initializeProjectFromPackage(projectId: number, packageId: number) {
    const packageFilms = await this.prisma.packageFilm.findMany({
      where: { package_id: packageId },
      include: {
        film: { include: { scenes: { orderBy: { order_index: 'asc' }, include: { schedule: { include: { event_day: true } } } } } },
        scene_schedules: { include: { event_day: true }, orderBy: { order_index: 'asc' } },
      },
      orderBy: { order_index: 'asc' },
    });

    if (!packageFilms.length) return { project_id: projectId, event_days_created: 0, films_created: 0, project_films: [] };

    const usedEventDayIds = new Set<number>();
    for (const pf of packageFilms) {
      for (const ss of pf.scene_schedules) { if (ss.event_day_template_id) usedEventDayIds.add(ss.event_day_template_id); }
      if (pf.film?.scenes) { for (const scene of pf.film.scenes) { if (scene.schedule?.event_day_template_id) usedEventDayIds.add(scene.schedule.event_day_template_id); } }
    }

    const existingProjectDays = await this.prisma.projectEventDay.findMany({ where: { project_id: projectId } });
    const existingTemplateIds = new Set(existingProjectDays.map(d => d.event_day_template_id).filter((id): id is number => id !== null));
    const eventDayMap = new Map<number, number>();
    for (const ped of existingProjectDays) { if (ped.event_day_template_id) eventDayMap.set(ped.event_day_template_id, ped.id); }

    for (const templateId of usedEventDayIds) {
      if (existingTemplateIds.has(templateId)) continue;
      const template = await this.prisma.eventDay.findUnique({ where: { id: templateId } });
      if (!template) continue;
      const day = await this.prisma.projectEventDay.create({
        data: { project_id: projectId, event_day_template_id: templateId, name: template.name, date: new Date(), order_index: template.order_index },
      });
      eventDayMap.set(templateId, day.id);
    }

    const createdProjectFilms = await this.copyFilmsFromPackage(projectId, packageFilms, eventDayMap);
    const activitiesCopied = await this.copyActivitiesFromPackage(projectId, packageId, eventDayMap);

    return {
      project_id: projectId, event_days_created: eventDayMap.size - existingTemplateIds.size,
      films_created: createdProjectFilms.length, activities_copied: activitiesCopied, project_films: createdProjectFilms,
    };
  }

  private async copyFilmsFromPackage(
    projectId: number,
    packageFilms: Prisma.PackageFilmGetPayload<{
      include: { film: { include: { scenes: { include: { schedule: { include: { event_day: true } } } } } }; scene_schedules: { include: { event_day: true } } };
    }>[],
    eventDayMap: Map<number, number>,
  ) {
    const result: ProjectFilm[] = [];
    for (const pf of packageFilms) {
      const existing = await this.prisma.projectFilm.findUnique({ where: { project_id_film_id: { project_id: projectId, film_id: pf.film_id } } });
      if (existing) { result.push(existing); continue; }
      const projectFilm = await this.prisma.projectFilm.create({ data: { project_id: projectId, film_id: pf.film_id, package_film_id: pf.id, order_index: pf.order_index } });
      if (pf.film?.scenes) {
        for (const scene of pf.film.scenes) {
          const source = pf.scene_schedules.find((s: { scene_id: number }) => s.scene_id === scene.id) || scene.schedule;
          if (source) {
            const projectEventDayId = source.event_day_template_id ? eventDayMap.get(source.event_day_template_id) ?? null : null;
            await this.prisma.projectFilmSceneSchedule.create({
              data: {
                project_film_id: projectFilm.id, scene_id: scene.id, project_event_day_id: projectEventDayId,
                scheduled_start_time: source.scheduled_start_time, scheduled_duration_minutes: source.scheduled_duration_minutes,
                moment_schedules: source.moment_schedules ?? undefined, beat_schedules: source.beat_schedules ?? undefined,
                notes: source.notes, order_index: scene.order_index, is_locked: false,
              },
            });
          }
        }
      }
      result.push(projectFilm);
    }
    return result;
  }

  private async copyActivitiesFromPackage(projectId: number, packageId: number, eventDayMap: Map<number, number>) {
    const packageEventDays = await this.prisma.packageEventDay.findMany({ where: { package_id: packageId } });
    const pedToProjectDay = new Map<number, number>();
    for (const ped of packageEventDays) { const pid = eventDayMap.get(ped.event_day_template_id); if (pid) pedToProjectDay.set(ped.id, pid); }

    const packageActivities = await this.prisma.packageActivity.findMany({ where: { package_id: packageId }, orderBy: { order_index: 'asc' } });
    let count = 0;
    for (const pa of packageActivities) {
      const projectEventDayId = pedToProjectDay.get(pa.package_event_day_id);
      if (!projectEventDayId) continue;
      await this.prisma.projectActivity.create({
        data: {
          project_id: projectId, project_event_day_id: projectEventDayId, package_activity_id: pa.id,
          name: pa.name, description: pa.description, color: pa.color, icon: pa.icon,
          start_time: pa.start_time, end_time: pa.end_time, duration_minutes: pa.duration_minutes,
          order_index: pa.order_index, is_locked: false,
        },
      });
      count++;
    }
    return count;
  }
}
