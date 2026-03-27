import { Prisma } from '@prisma/client';

/** Shape stored in Prisma Json? columns for moment_schedules */
export interface MomentScheduleEntry {
  moment_id: number;
  start_time?: string | null;
  duration_minutes?: number | null;
}

/** Shape stored in Prisma Json? columns for beat_schedules */
export interface BeatScheduleEntry {
  beat_id: number;
  start_time?: string | null;
  duration_minutes?: number | null;
}

/** FilmSceneSchedule with event_day relation included */
export type FilmSceneScheduleWithDay = Prisma.FilmSceneScheduleGetPayload<{ include: { event_day: true } }>;

/** PackageFilmSceneSchedule with event_day relation included */
export type PackageFilmSceneScheduleWithDay = Prisma.PackageFilmSceneScheduleGetPayload<{ include: { event_day: true } }>;

/** ProjectFilmSceneSchedule with project_event_day relation included */
export type ProjectFilmSceneScheduleWithDay = Prisma.ProjectFilmSceneScheduleGetPayload<{ include: { project_event_day: true } }>;

/** Complex payload used during Project initialization from Package */
export type PackageFilmWithDetails = Prisma.PackageFilmGetPayload<{
  include: {
    film: {
      include: {
        scenes: {
          include: {
            schedule: { include: { event_day: true } };
          };
        };
      };
    };
    scene_schedules: {
      include: { event_day: true };
    };
  };
}>;
