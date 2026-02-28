import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
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
  RenameSchedulePresetDto,
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

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // ─── Shared Schedule Presets ───────────────────────────────────────

  @Get('presets/brand/:brandId')
  getSchedulePresets(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.scheduleService.getSchedulePresets(brandId);
  }

  @Post('presets/brand/:brandId')
  upsertSchedulePreset(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: UpsertSchedulePresetDto,
  ) {
    return this.scheduleService.upsertSchedulePreset(brandId, dto);
  }

  @Patch('presets/:presetId/brand/:brandId/rename')
  renameSchedulePreset(
    @Param('presetId', ParseIntPipe) presetId: number,
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: RenameSchedulePresetDto,
  ) {
    return this.scheduleService.renameSchedulePreset(brandId, presetId, dto.name);
  }

  @Delete('presets/:presetId/brand/:brandId')
  deleteSchedulePreset(
    @Param('presetId', ParseIntPipe) presetId: number,
    @Param('brandId', ParseIntPipe) brandId: number,
  ) {
    return this.scheduleService.deleteSchedulePreset(brandId, presetId);
  }

  // ─── Event Day Templates ─────────────────────────────────────────────

  @Get('event-days/brand/:brandId')
  getEventDayTemplates(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.scheduleService.findAllEventDayTemplates(brandId);
  }

  @Post('event-days/brand/:brandId')
  createEventDayTemplate(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: CreateEventDayTemplateDto,
  ) {
    return this.scheduleService.createEventDayTemplate(brandId, dto);
  }

  @Patch('event-days/:id/brand/:brandId')
  updateEventDayTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: UpdateEventDayTemplateDto,
  ) {
    return this.scheduleService.updateEventDayTemplate(id, brandId, dto);
  }

  @Delete('event-days/:id/brand/:brandId')
  deleteEventDayTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Param('brandId', ParseIntPipe) brandId: number,
  ) {
    return this.scheduleService.deleteEventDayTemplate(id, brandId);
  }

  // ─── Film Scene Schedules ────────────────────────────────────────────

  @Get('films/:filmId')
  getFilmSchedule(@Param('filmId', ParseIntPipe) filmId: number) {
    return this.scheduleService.getFilmSchedule(filmId);
  }

  @Post('films/:filmId/scenes')
  upsertFilmSceneSchedule(
    @Param('filmId', ParseIntPipe) filmId: number,
    @Body() dto: CreateFilmSceneScheduleDto,
  ) {
    return this.scheduleService.upsertFilmSceneSchedule(filmId, dto);
  }

  @Post('films/:filmId/scenes/bulk')
  bulkUpsertFilmSceneSchedules(
    @Param('filmId', ParseIntPipe) filmId: number,
    @Body() schedules: BulkUpsertFilmSceneScheduleDto[],
  ) {
    return this.scheduleService.bulkUpsertFilmSceneSchedules(filmId, schedules);
  }

  @Patch('films/scenes/:scheduleId')
  updateFilmSceneSchedule(
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Body() dto: UpdateFilmSceneScheduleDto,
  ) {
    return this.scheduleService.updateFilmSceneSchedule(scheduleId, dto);
  }

  @Delete('films/scenes/:scheduleId')
  deleteFilmSceneSchedule(
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
  ) {
    return this.scheduleService.deleteFilmSceneSchedule(scheduleId);
  }

  // ─── Package Event Days ─────────────────────────────────────────────

  @Get('packages/:packageId/event-days')
  getPackageEventDays(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.scheduleService.getPackageEventDays(packageId);
  }

  @Post('packages/:packageId/event-days')
  addPackageEventDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() dto: AddPackageEventDayDto,
  ) {
    return this.scheduleService.addPackageEventDay(packageId, dto);
  }

  @Post('packages/:packageId/event-days/set')
  setPackageEventDays(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() dto: SetPackageEventDaysDto,
  ) {
    return this.scheduleService.setPackageEventDays(packageId, dto);
  }

  @Delete('packages/:packageId/event-days/:eventDayTemplateId')
  removePackageEventDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Param('eventDayTemplateId', ParseIntPipe) eventDayTemplateId: number,
  ) {
    return this.scheduleService.removePackageEventDay(packageId, eventDayTemplateId);
  }

  // ─── Package Films ───────────────────────────────────────────────────

  @Get('packages/:packageId/films')
  getPackageFilms(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.scheduleService.getPackageFilms(packageId);
  }

  @Post('packages/:packageId/films')
  createPackageFilm(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() dto: CreatePackageFilmDto,
  ) {
    return this.scheduleService.createPackageFilm(packageId, dto);
  }

  @Patch('packages/films/:packageFilmId')
  updatePackageFilm(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @Body() dto: UpdatePackageFilmDto,
  ) {
    return this.scheduleService.updatePackageFilm(packageFilmId, dto);
  }

  @Delete('packages/films/:packageFilmId')
  deletePackageFilm(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
  ) {
    return this.scheduleService.deletePackageFilm(packageFilmId);
  }

  // ─── Package Film Scene Schedules ────────────────────────────────────

  @Get('packages/films/:packageFilmId/schedule')
  getPackageFilmSchedule(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
  ) {
    return this.scheduleService.getPackageFilmSchedule(packageFilmId);
  }

  @Post('packages/films/:packageFilmId/scenes')
  upsertPackageFilmSceneSchedule(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @Body() dto: UpsertPackageFilmSceneScheduleDto,
  ) {
    return this.scheduleService.upsertPackageFilmSceneSchedule(packageFilmId, dto);
  }

  @Post('packages/films/:packageFilmId/scenes/bulk')
  bulkUpsertPackageFilmSceneSchedules(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @Body() schedules: UpsertPackageFilmSceneScheduleDto[],
  ) {
    return this.scheduleService.bulkUpsertPackageFilmSceneSchedules(
      packageFilmId,
      schedules,
    );
  }

  // ─── Package Activities ──────────────────────────────────────────────

  @Get('packages/:packageId/activities')
  getPackageActivities(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.scheduleService.getPackageActivities(packageId);
  }

  @Get('packages/:packageId/activities/day/:packageEventDayId')
  getPackageActivitiesByDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Param('packageEventDayId', ParseIntPipe) packageEventDayId: number,
  ) {
    return this.scheduleService.getPackageActivitiesByDay(packageId, packageEventDayId);
  }

  @Post('packages/:packageId/activities')
  createPackageActivity(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() dto: CreatePackageActivityDto,
  ) {
    return this.scheduleService.createPackageActivity(packageId, dto);
  }

  @Patch('packages/activities/:activityId')
  updatePackageActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() dto: UpdatePackageActivityDto,
  ) {
    return this.scheduleService.updatePackageActivity(activityId, dto);
  }

  @Delete('packages/activities/:activityId')
  deletePackageActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.scheduleService.deletePackageActivity(activityId);
  }

  @Post('packages/:packageId/activities/day/:packageEventDayId/reorder')
  reorderPackageActivities(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Param('packageEventDayId', ParseIntPipe) packageEventDayId: number,
    @Body() body: { activity_ids: number[] },
  ) {
    return this.scheduleService.reorderPackageActivities(
      packageId,
      packageEventDayId,
      body.activity_ids,
    );
  }

  // ─── Package Activity Moments ────────────────────────────────────────

  @Get('packages/activities/:activityId/moments')
  getActivityMoments(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.scheduleService.getActivityMoments(activityId);
  }

  @Post('packages/activities/:activityId/moments')
  createActivityMoment(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() dto: CreatePackageActivityMomentDto,
  ) {
    return this.scheduleService.createActivityMoment(activityId, dto);
  }

  @Post('packages/activities/:activityId/moments/bulk')
  bulkCreateActivityMoments(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() dto: BulkCreatePackageActivityMomentsDto,
  ) {
    return this.scheduleService.bulkCreateActivityMoments(activityId, dto);
  }

  @Patch('packages/activities/moments/:momentId')
  updateActivityMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body() dto: UpdatePackageActivityMomentDto,
  ) {
    return this.scheduleService.updateActivityMoment(momentId, dto);
  }

  @Delete('packages/activities/moments/:momentId')
  deleteActivityMoment(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.scheduleService.deleteActivityMoment(momentId);
  }

  @Post('packages/activities/:activityId/moments/reorder')
  reorderActivityMoments(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() body: { moment_ids: number[] },
  ) {
    return this.scheduleService.reorderActivityMoments(activityId, body.moment_ids);
  }

  // ─── Project Activities ──────────────────────────────────────────────

  @Get('projects/:projectId/activities/:projectEventDayId')
  getProjectActivities(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('projectEventDayId', ParseIntPipe) projectEventDayId: number,
  ) {
    return this.scheduleService.getProjectActivities(projectId, projectEventDayId);
  }

  @Post('projects/:projectId/activities')
  createProjectActivity(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateProjectActivityDto,
  ) {
    return this.scheduleService.createProjectActivity(projectId, dto);
  }

  @Patch('projects/activities/:activityId')
  updateProjectActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() dto: UpdateProjectActivityDto,
  ) {
    return this.scheduleService.updateProjectActivity(activityId, dto);
  }

  @Delete('projects/activities/:activityId')
  deleteProjectActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.scheduleService.deleteProjectActivity(activityId);
  }

  // ─── Package Event Day Subjects ──────────────────────────────────────

  @Get('packages/:packageId/subjects')
  getPackageEventDaySubjects(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Query('eventDayTemplateId') eventDayTemplateId?: string,
  ) {
    return this.scheduleService.getPackageEventDaySubjects(
      packageId,
      eventDayTemplateId ? parseInt(eventDayTemplateId, 10) : undefined,
    );
  }

  @Post('packages/:packageId/subjects')
  createPackageEventDaySubject(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() dto: CreatePackageEventDaySubjectDto,
  ) {
    return this.scheduleService.createPackageEventDaySubject(packageId, dto);
  }

  @Patch('packages/subjects/:subjectId')
  updatePackageEventDaySubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Body() dto: UpdatePackageEventDaySubjectDto,
  ) {
    return this.scheduleService.updatePackageEventDaySubject(subjectId, dto);
  }

  @Delete('packages/subjects/:subjectId')
  deletePackageEventDaySubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    return this.scheduleService.deletePackageEventDaySubject(subjectId);
  }

  // ─── Subject Activity Assignments (multi-activity) ────────────────

  @Post('packages/subjects/:subjectId/activities/:activityId')
  assignSubjectToActivity(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.scheduleService.assignSubjectToActivity(subjectId, activityId);
  }

  @Delete('packages/subjects/:subjectId/activities/:activityId')
  unassignSubjectFromActivity(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.scheduleService.unassignSubjectFromActivity(subjectId, activityId);
  }

  // ─── Package Event Day Locations ──────────────────────────────────────

  @Get('packages/:packageId/locations')
  getPackageEventDayLocations(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Query('eventDayTemplateId') eventDayTemplateId?: string,
  ) {
    return this.scheduleService.getPackageEventDayLocations(
      packageId,
      eventDayTemplateId ? parseInt(eventDayTemplateId, 10) : undefined,
    );
  }

  @Post('packages/:packageId/locations')
  createPackageEventDayLocation(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() dto: CreatePackageEventDayLocationDto,
  ) {
    return this.scheduleService.createPackageEventDayLocation(packageId, dto);
  }

  @Patch('packages/locations/:locationId')
  updatePackageEventDayLocation(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() dto: UpdatePackageEventDayLocationDto,
  ) {
    return this.scheduleService.updatePackageEventDayLocation(locationId, dto);
  }

  @Delete('packages/locations/:locationId')
  deletePackageEventDayLocation(
    @Param('locationId', ParseIntPipe) locationId: number,
  ) {
    return this.scheduleService.deletePackageEventDayLocation(locationId);
  }

  // ─── Package Location Slots (abstract numbered locations 1-5) ────────

  @Get('packages/:packageId/location-slots')
  getPackageLocationSlots(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Query('eventDayTemplateId') eventDayTemplateId?: string,
  ) {
    return this.scheduleService.getPackageLocationSlots(
      packageId,
      eventDayTemplateId ? parseInt(eventDayTemplateId, 10) : undefined,
    );
  }

  @Post('packages/:packageId/location-slots')
  createPackageLocationSlot(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() dto: CreatePackageLocationSlotDto,
  ) {
    return this.scheduleService.createPackageLocationSlot(packageId, dto);
  }

  @Delete('packages/location-slots/:slotId')
  deletePackageLocationSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.scheduleService.deletePackageLocationSlot(slotId);
  }

  @Post('packages/location-slots/:slotId/activities/:activityId')
  assignLocationSlotToActivity(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.scheduleService.assignLocationSlotToActivity(slotId, activityId);
  }

  @Delete('packages/location-slots/:slotId/activities/:activityId')
  unassignLocationSlotFromActivity(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.scheduleService.unassignLocationSlotFromActivity(slotId, activityId);
  }

  // ─── Project Event Days ──────────────────────────────────────────────

  @Get('projects/:projectId/event-days')
  getProjectEventDays(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.scheduleService.getProjectEventDays(projectId);
  }

  @Post('projects/:projectId/event-days')
  createProjectEventDay(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateProjectEventDayDto,
  ) {
    return this.scheduleService.createProjectEventDay(projectId, dto);
  }

  @Patch('projects/event-days/:eventDayId')
  updateProjectEventDay(
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
    @Body() dto: UpdateProjectEventDayDto,
  ) {
    return this.scheduleService.updateProjectEventDay(eventDayId, dto);
  }

  @Delete('projects/event-days/:eventDayId')
  deleteProjectEventDay(
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
  ) {
    return this.scheduleService.deleteProjectEventDay(eventDayId);
  }

  // ─── Project Films ───────────────────────────────────────────────────

  @Get('projects/:projectId/films')
  getProjectFilms(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.scheduleService.getProjectFilms(projectId);
  }

  @Post('projects/:projectId/films')
  createProjectFilm(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateProjectFilmDto,
  ) {
    return this.scheduleService.createProjectFilm(projectId, dto);
  }

  @Post('projects/:projectId/initialize-from-package/:packageId')
  initializeProjectFromPackage(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('packageId', ParseIntPipe) packageId: number,
  ) {
    return this.scheduleService.initializeProjectFromPackage(projectId, packageId);
  }

  @Delete('projects/films/:projectFilmId')
  deleteProjectFilm(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
  ) {
    return this.scheduleService.deleteProjectFilm(projectFilmId);
  }

  // ─── Project Film Scene Schedules ────────────────────────────────────

  @Post('projects/films/:projectFilmId/scenes')
  upsertProjectFilmSceneSchedule(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body() dto: UpsertProjectFilmSceneScheduleDto,
  ) {
    return this.scheduleService.upsertProjectFilmSceneSchedule(projectFilmId, dto);
  }

  @Post('projects/films/:projectFilmId/scenes/bulk')
  bulkUpsertProjectFilmSceneSchedules(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body() schedules: UpsertProjectFilmSceneScheduleDto[],
  ) {
    return this.scheduleService.bulkUpsertProjectFilmSceneSchedules(
      projectFilmId,
      schedules,
    );
  }

  // ─── Resolved Schedule ───────────────────────────────────────────────

  @Get('resolved/:filmId')
  getResolvedSchedule(
    @Param('filmId', ParseIntPipe) filmId: number,
    @Query('packageFilmId') packageFilmId?: string,
    @Query('projectFilmId') projectFilmId?: string,
  ) {
    return this.scheduleService.getResolvedSchedule({
      filmId,
      packageFilmId: packageFilmId ? parseInt(packageFilmId, 10) : undefined,
      projectFilmId: projectFilmId ? parseInt(projectFilmId, 10) : undefined,
    });
  }
}
