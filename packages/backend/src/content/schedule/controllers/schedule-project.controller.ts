import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScheduleProjectService } from '../services/schedule-project.service';
import { ScheduleFilmService } from '../services/schedule-film.service';
import { ScheduleDiffService } from '../services/schedule-diff.service';
import {
  CreateProjectEventDayDto, UpdateProjectEventDayDto,
  CreateProjectFilmDto, UpsertProjectFilmSceneScheduleDto,
  CreateProjectActivityDto, UpdateProjectActivityDto,
} from '../dto';
import { ResolvedScheduleQueryDto } from '../dto/resolved-schedule-query.dto';

@Controller('api/schedule')
@UseGuards(AuthGuard('jwt'))
export class ScheduleProjectController {
  constructor(
    private readonly projectService: ScheduleProjectService,
    private readonly filmService: ScheduleFilmService,
    private readonly diffService: ScheduleDiffService,
  ) {}

  @Get('projects/:projectId/event-days')
  getProjectEventDays(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectService.getProjectEventDays(projectId);
  }

  @Post('projects/:projectId/event-days')
  createProjectEventDay(@Param('projectId', ParseIntPipe) projectId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateProjectEventDayDto) {
    return this.projectService.createProjectEventDay(projectId, dto);
  }

  @Patch('projects/event-days/:eventDayId')
  updateProjectEventDay(@Param('eventDayId', ParseIntPipe) eventDayId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateProjectEventDayDto) {
    return this.projectService.updateProjectEventDay(eventDayId, dto);
  }

  @Delete('projects/event-days/:eventDayId')
  deleteProjectEventDay(@Param('eventDayId', ParseIntPipe) eventDayId: number) {
    return this.projectService.deleteProjectEventDay(eventDayId);
  }

  @Get('projects/:projectId/films')
  getProjectFilms(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectService.getProjectFilms(projectId);
  }

  @Post('projects/:projectId/films')
  createProjectFilm(@Param('projectId', ParseIntPipe) projectId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateProjectFilmDto) {
    return this.projectService.createProjectFilm(projectId, dto);
  }

  @Post('projects/:projectId/initialize-from-package/:packageId')
  initializeProjectFromPackage(@Param('projectId', ParseIntPipe) projectId: number, @Param('packageId', ParseIntPipe) packageId: number) {
    return this.projectService.initializeProjectFromPackage(projectId, packageId);
  }

  @Delete('projects/films/:projectFilmId')
  deleteProjectFilm(@Param('projectFilmId', ParseIntPipe) projectFilmId: number) {
    return this.projectService.deleteProjectFilm(projectFilmId);
  }

  @Post('projects/films/:projectFilmId/scenes')
  upsertProjectFilmSceneSchedule(@Param('projectFilmId', ParseIntPipe) projectFilmId: number, @Body(new ValidationPipe({ transform: true })) dto: UpsertProjectFilmSceneScheduleDto) {
    return this.projectService.upsertProjectFilmSceneSchedule(projectFilmId, dto);
  }

  @Post('projects/films/:projectFilmId/scenes/bulk')
  bulkUpsertProjectFilmSceneSchedules(@Param('projectFilmId', ParseIntPipe) projectFilmId: number, @Body(new ValidationPipe({ transform: true })) schedules: UpsertProjectFilmSceneScheduleDto[]) {
    return this.projectService.bulkUpsertProjectFilmSceneSchedules(projectFilmId, schedules);
  }

  @Get('projects/:projectId/activities/:projectEventDayId')
  getProjectActivities(@Param('projectId', ParseIntPipe) projectId: number, @Param('projectEventDayId', ParseIntPipe) projectEventDayId: number) {
    return this.projectService.getProjectActivities(projectId, projectEventDayId);
  }

  @Post('projects/:projectId/activities')
  createProjectActivity(@Param('projectId', ParseIntPipe) projectId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateProjectActivityDto) {
    return this.projectService.createProjectActivity(projectId, dto);
  }

  @Patch('projects/activities/:activityId')
  updateProjectActivity(@Param('activityId', ParseIntPipe) activityId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateProjectActivityDto) {
    return this.projectService.updateProjectActivity(activityId, dto);
  }

  @Delete('projects/activities/:activityId')
  deleteProjectActivity(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.projectService.deleteProjectActivity(activityId);
  }

  @Get('resolved/:filmId')
  getResolvedSchedule(
    @Param('filmId', ParseIntPipe) filmId: number,
    @Query(new ValidationPipe({ transform: true })) query: ResolvedScheduleQueryDto,
  ) {
    return this.filmService.getResolvedSchedule({
      filmId,
      packageFilmId: query.packageFilmId,
      projectFilmId: query.projectFilmId,
    });
  }

  @Get('projects/:projectId/diff')
  getProjectScheduleDiff(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.diffService.getScheduleDiff({ project_id: projectId });
  }
}
