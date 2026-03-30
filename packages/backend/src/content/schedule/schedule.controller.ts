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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  SchedulePresetService,
  ScheduleFilmService,
  SchedulePackageService,
  SchedulePackageActivityService,
  SchedulePackageResourceService,
  ScheduleProjectService,
  ScheduleInstanceService,
  ScheduleInstanceResourceService,
  ScheduleInstanceCrewSlotsService,
} from './services';
import {
  CreateEventDayDto,
  UpdateEventDayDto,
  CreateEventDayActivityDto,
  UpdateEventDayActivityDto,
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
  CreatePackageDaySubjectDto,
  UpdatePackageDaySubjectDto,
  CreatePackageEventDayLocationDto,
  UpdatePackageEventDayLocationDto,
  CreatePackageLocationSlotDto,
  CreatePackageActivityMomentDto,
  UpdatePackageActivityMomentDto,
  BulkCreatePackageActivityMomentsDto,
  CreatePresetMomentDto,
  UpdatePresetMomentDto,
  CreateInstanceActivityMomentDto,
  UpdateInstanceActivityMomentDto,
  CreateInstanceEventDaySubjectDto,
  UpdateInstanceEventDaySubjectDto,
  CreateInstanceLocationSlotDto,
  UpdateInstanceLocationSlotDto,
  CreateInstanceCrewSlotDto,
  UpdateInstanceCrewSlotDto,
} from './dto';
import { EventDayIdQueryDto } from './dto/event-day-id-query.dto';
import { ResolvedScheduleQueryDto } from './dto/resolved-schedule-query.dto';

@Controller('api/schedule')
@UseGuards(AuthGuard('jwt'))
export class ScheduleController {
  constructor(
    private readonly presetService: SchedulePresetService,
    private readonly filmService: ScheduleFilmService,
    private readonly packageService: SchedulePackageService,
    private readonly packageActivityService: SchedulePackageActivityService,
    private readonly packageResourceService: SchedulePackageResourceService,
    private readonly projectService: ScheduleProjectService,
    private readonly instanceService: ScheduleInstanceService,
    private readonly instanceResourceService: ScheduleInstanceResourceService,
    private readonly instanceCrewService: ScheduleInstanceCrewSlotsService,
  ) {}

  // ─── Shared Schedule Presets ───────────────────────────────────────

  @Get('presets/brand/:brandId')
  getSchedulePresets(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.presetService.getSchedulePresets(brandId);
  }

  @Post('presets/brand/:brandId')
  upsertSchedulePreset(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpsertSchedulePresetDto,
  ) {
    return this.presetService.upsertSchedulePreset(brandId, dto);
  }

  @Patch('presets/:presetId/brand/:brandId/rename')
  renameSchedulePreset(
    @Param('presetId', ParseIntPipe) presetId: number,
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: RenameSchedulePresetDto,
  ) {
    return this.presetService.renameSchedulePreset(brandId, presetId, dto.name);
  }

  @Delete('presets/:presetId/brand/:brandId')
  deleteSchedulePreset(
    @Param('presetId', ParseIntPipe) presetId: number,
    @Param('brandId', ParseIntPipe) brandId: number,
  ) {
    return this.presetService.deleteSchedulePreset(brandId, presetId);
  }

  // ─── Event Day Templates ─────────────────────────────────────────────

  @Get('event-days/brand/:brandId')
  getEventDays(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.presetService.findAllEventDays(brandId);
  }

  @Post('event-days/brand/:brandId')
  createEventDay(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateEventDayDto,
  ) {
    return this.presetService.createEventDay(brandId, dto);
  }

  @Patch('event-days/:id/brand/:brandId')
  updateEventDay(
    @Param('id', ParseIntPipe) id: number,
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateEventDayDto,
  ) {
    return this.presetService.updateEventDay(id, brandId, dto);
  }

  @Delete('event-days/:id/brand/:brandId')
  deleteEventDay(
    @Param('id', ParseIntPipe) id: number,
    @Param('brandId', ParseIntPipe) brandId: number,
  ) {
    return this.presetService.deleteEventDay(id, brandId);
  }

  // ─── Event Day Activity Presets ──────────────────────────────────────

  @Get('event-days/:eventDayId/activity-presets')
  getActivityPresets(
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
  ) {
    return this.presetService.findActivityPresets(eventDayId);
  }

  @Post('event-days/:eventDayId/activity-presets')
  createActivityPreset(
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateEventDayActivityDto,
  ) {
    return this.presetService.createActivityPreset(eventDayId, dto);
  }

  @Post('event-days/:eventDayId/activity-presets/bulk')
  bulkCreateActivityPresets(
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
    @Body(new ValidationPipe({ transform: true })) body: { presets: { name: string; color?: string; order_index?: number }[] },
  ) {
    return this.presetService.bulkCreateActivityPresets(eventDayId, body.presets);
  }

  @Patch('activity-presets/:presetId')
  updateActivityPreset(
    @Param('presetId', ParseIntPipe) presetId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateEventDayActivityDto,
  ) {
    return this.presetService.updateActivityPreset(presetId, dto);
  }

  @Delete('activity-presets/:presetId')
  deleteActivityPreset(
    @Param('presetId', ParseIntPipe) presetId: number,
  ) {
    return this.presetService.deleteActivityPreset(presetId);
  }

  // ─── Preset Moments ────────────────────────────────────────────────────────

  @Get('activity-presets/:presetId/moments')
  getPresetMoments(
    @Param('presetId', ParseIntPipe) presetId: number,
  ) {
    return this.presetService.findPresetMoments(presetId);
  }

  @Post('activity-presets/:presetId/moments')
  createPresetMoment(
    @Param('presetId', ParseIntPipe) presetId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePresetMomentDto,
  ) {
    return this.presetService.createPresetMoment(presetId, dto);
  }

  @Post('activity-presets/:presetId/moments/bulk')
  bulkCreatePresetMoments(
    @Param('presetId', ParseIntPipe) presetId: number,
    @Body(new ValidationPipe({ transform: true })) body: { moments: { name: string; duration_seconds?: number; order_index?: number; is_key_moment?: boolean }[] },
  ) {
    return this.presetService.bulkCreatePresetMoments(presetId, body.moments);
  }

  @Patch('preset-moments/:momentId')
  updatePresetMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePresetMomentDto,
  ) {
    return this.presetService.updatePresetMoment(momentId, dto);
  }

  @Delete('preset-moments/:momentId')
  deletePresetMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
  ) {
    return this.presetService.deletePresetMoment(momentId);
  }

  // ─── Film Scene Schedules ────────────────────────────────────────────

  @Get('films/:filmId')
  getFilmSchedule(@Param('filmId', ParseIntPipe) filmId: number) {
    return this.filmService.getFilmSchedule(filmId);
  }

  @Post('films/:filmId/scenes')
  upsertFilmSceneSchedule(
    @Param('filmId', ParseIntPipe) filmId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateFilmSceneScheduleDto,
  ) {
    return this.filmService.upsertFilmSceneSchedule(filmId, dto);
  }

  @Post('films/:filmId/scenes/bulk')
  bulkUpsertFilmSceneSchedules(
    @Param('filmId', ParseIntPipe) filmId: number,
    @Body(new ValidationPipe({ transform: true })) schedules: BulkUpsertFilmSceneScheduleDto[],
  ) {
    return this.filmService.bulkUpsertFilmSceneSchedules(filmId, schedules);
  }

  @Patch('films/scenes/:scheduleId')
  updateFilmSceneSchedule(
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateFilmSceneScheduleDto,
  ) {
    return this.filmService.updateFilmSceneSchedule(scheduleId, dto);
  }

  @Delete('films/scenes/:scheduleId')
  deleteFilmSceneSchedule(
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
  ) {
    return this.filmService.deleteFilmSceneSchedule(scheduleId);
  }

  // ─── Package Schedule Summary ────────────────────────────────────────

  @Get('packages/:packageId/summary')
  getPackageScheduleSummary(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.packageService.getPackageScheduleSummary(packageId);
  }

  // ─── Package Event Days ─────────────────────────────────────────────

  @Get('packages/:packageId/event-days')
  getPackageEventDays(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.packageService.getPackageEventDays(packageId);
  }

  @Post('packages/:packageId/event-days')
  addPackageEventDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body(new ValidationPipe({ transform: true })) dto: AddPackageEventDayDto,
  ) {
    return this.packageService.addPackageEventDay(packageId, dto);
  }

  @Post('packages/:packageId/event-days/set')
  setPackageEventDays(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body(new ValidationPipe({ transform: true })) dto: SetPackageEventDaysDto,
  ) {
    return this.packageService.setPackageEventDays(packageId, dto);
  }

  @Delete('packages/:packageId/event-days/:eventDayId')
  removePackageEventDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
  ) {
    return this.packageService.removePackageEventDay(packageId, eventDayId);
  }

  // ─── Package Films ───────────────────────────────────────────────────

  @Get('packages/:packageId/films')
  getPackageFilms(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.packageService.getPackageFilms(packageId);
  }

  @Post('packages/:packageId/films')
  createPackageFilm(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageFilmDto,
  ) {
    return this.packageService.createPackageFilm(packageId, dto);
  }

  @Patch('packages/films/:packageFilmId')
  updatePackageFilm(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageFilmDto,
  ) {
    return this.packageService.updatePackageFilm(packageFilmId, dto);
  }

  @Delete('packages/films/:packageFilmId')
  deletePackageFilm(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
  ) {
    return this.packageService.deletePackageFilm(packageFilmId);
  }

  // ─── Package Film Scene Schedules ────────────────────────────────────

  @Get('packages/films/:packageFilmId/schedule')
  getPackageFilmSchedule(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
  ) {
    return this.packageService.getPackageFilmSchedule(packageFilmId);
  }

  @Post('packages/films/:packageFilmId/scenes')
  upsertPackageFilmSceneSchedule(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpsertPackageFilmSceneScheduleDto,
  ) {
    return this.packageService.upsertPackageFilmSceneSchedule(packageFilmId, dto);
  }

  @Post('packages/films/:packageFilmId/scenes/bulk')
  bulkUpsertPackageFilmSceneSchedules(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @Body(new ValidationPipe({ transform: true })) schedules: UpsertPackageFilmSceneScheduleDto[],
  ) {
    return this.packageService.bulkUpsertPackageFilmSceneSchedules(
      packageFilmId,
      schedules,
    );
  }

  // ─── Package Activities ──────────────────────────────────────────────

  @Get('packages/:packageId/activities')
  getPackageActivities(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.packageActivityService.getPackageActivities(packageId);
  }

  @Get('packages/:packageId/activities/day/:packageEventDayId')
  getPackageActivitiesByDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Param('packageEventDayId', ParseIntPipe) packageEventDayId: number,
  ) {
    return this.packageActivityService.getPackageActivitiesByDay(packageId, packageEventDayId);
  }

  @Post('packages/:packageId/activities')
  createPackageActivity(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageActivityDto,
  ) {
    return this.packageActivityService.createPackageActivity(packageId, dto);
  }

  @Patch('packages/activities/:activityId')
  updatePackageActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageActivityDto,
  ) {
    return this.packageActivityService.updatePackageActivity(activityId, dto);
  }

  @Delete('packages/activities/:activityId')
  deletePackageActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.packageActivityService.deletePackageActivity(activityId);
  }

  @Post('packages/:packageId/activities/day/:packageEventDayId/reorder')
  reorderPackageActivities(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Param('packageEventDayId', ParseIntPipe) packageEventDayId: number,
    @Body(new ValidationPipe({ transform: true })) body: { activity_ids: number[] },
  ) {
    return this.packageActivityService.reorderPackageActivities(
      packageId,
      packageEventDayId,
      body.activity_ids,
    );
  }

  // ─── Package Activity Moments ────────────────────────────────────────

  @Get('packages/activities/:activityId/moments')
  getActivityMoments(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.packageActivityService.getActivityMoments(activityId);
  }

  @Post('packages/activities/:activityId/moments')
  createActivityMoment(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageActivityMomentDto,
  ) {
    return this.packageActivityService.createActivityMoment(activityId, dto);
  }

  @Post('packages/activities/:activityId/moments/bulk')
  bulkCreateActivityMoments(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body(new ValidationPipe({ transform: true })) dto: BulkCreatePackageActivityMomentsDto,
  ) {
    return this.packageActivityService.bulkCreateActivityMoments(activityId, dto);
  }

  @Patch('packages/activities/moments/:momentId')
  updateActivityMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageActivityMomentDto,
  ) {
    return this.packageActivityService.updateActivityMoment(momentId, dto);
  }

  @Delete('packages/activities/moments/:momentId')
  deleteActivityMoment(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.packageActivityService.deleteActivityMoment(momentId);
  }

  @Post('packages/activities/:activityId/moments/reorder')
  reorderActivityMoments(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body(new ValidationPipe({ transform: true })) body: { moment_ids: number[] },
  ) {
    return this.packageActivityService.reorderActivityMoments(activityId, body.moment_ids);
  }

  // ─── Project Activities ──────────────────────────────────────────────

  @Get('projects/:projectId/activities/:projectEventDayId')
  getProjectActivities(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('projectEventDayId', ParseIntPipe) projectEventDayId: number,
  ) {
    return this.projectService.getProjectActivities(projectId, projectEventDayId);
  }

  @Post('projects/:projectId/activities')
  createProjectActivity(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateProjectActivityDto,
  ) {
    return this.projectService.createProjectActivity(projectId, dto);
  }

  @Patch('projects/activities/:activityId')
  updateProjectActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateProjectActivityDto,
  ) {
    return this.projectService.updateProjectActivity(activityId, dto);
  }

  @Delete('projects/activities/:activityId')
  deleteProjectActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.projectService.deleteProjectActivity(activityId);
  }

  // ─── Package Event Day Subjects ──────────────────────────────────────

  @Get('packages/:packageId/subjects')
  getPackageEventDaySubjects(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto,
  ) {
    return this.packageResourceService.getPackageEventDaySubjects(
      packageId,
      query.eventDayId,
    );
  }

  @Post('packages/:packageId/subjects')
  createPackageEventDaySubject(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageDaySubjectDto,
  ) {
    return this.packageResourceService.createPackageEventDaySubject(packageId, dto);
  }

  @Patch('packages/subjects/:subjectId')
  updatePackageEventDaySubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageDaySubjectDto,
  ) {
    return this.packageResourceService.updatePackageEventDaySubject(subjectId, dto);
  }

  @Delete('packages/subjects/:subjectId')
  deletePackageEventDaySubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    return this.packageResourceService.deletePackageEventDaySubject(subjectId);
  }

  // ─── Subject Activity Assignments (multi-activity) ────────────────

  @Post('packages/subjects/:subjectId/activities/:activityId')
  assignSubjectToActivity(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.packageResourceService.assignSubjectToActivity(subjectId, activityId);
  }

  @Delete('packages/subjects/:subjectId/activities/:activityId')
  unassignSubjectFromActivity(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.packageResourceService.unassignSubjectFromActivity(subjectId, activityId);
  }

  // ─── Package Event Day Locations ──────────────────────────────────────

  @Get('packages/:packageId/locations')
  getPackageEventDayLocations(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto,
  ) {
    return this.packageResourceService.getPackageEventDayLocations(
      packageId,
      query.eventDayId,
    );
  }

  @Post('packages/:packageId/locations')
  createPackageEventDayLocation(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageEventDayLocationDto,
  ) {
    return this.packageResourceService.createPackageEventDayLocation(packageId, dto);
  }

  @Patch('packages/locations/:locationId')
  updatePackageEventDayLocation(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageEventDayLocationDto,
  ) {
    return this.packageResourceService.updatePackageEventDayLocation(locationId, dto);
  }

  @Delete('packages/locations/:locationId')
  deletePackageEventDayLocation(
    @Param('locationId', ParseIntPipe) locationId: number,
  ) {
    return this.packageResourceService.deletePackageEventDayLocation(locationId);
  }

  // ─── Package Location Slots (abstract numbered locations 1-5) ────────

  @Get('packages/:packageId/location-slots')
  getPackageLocationSlots(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto,
  ) {
    return this.packageResourceService.getPackageLocationSlots(
      packageId,
      query.eventDayId,
    );
  }

  @Post('packages/:packageId/location-slots')
  createPackageLocationSlot(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageLocationSlotDto,
  ) {
    return this.packageResourceService.createPackageLocationSlot(packageId, dto);
  }

  @Delete('packages/location-slots/:slotId')
  deletePackageLocationSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.packageResourceService.deletePackageLocationSlot(slotId);
  }

  @Post('packages/location-slots/:slotId/activities/:activityId')
  assignLocationSlotToActivity(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.packageResourceService.assignLocationSlotToActivity(slotId, activityId);
  }

  @Delete('packages/location-slots/:slotId/activities/:activityId')
  unassignLocationSlotFromActivity(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.packageResourceService.unassignLocationSlotFromActivity(slotId, activityId);
  }

  // ─── Project Event Days ──────────────────────────────────────────────

  @Get('projects/:projectId/event-days')
  getProjectEventDays(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectService.getProjectEventDays(projectId);
  }

  @Post('projects/:projectId/event-days')
  createProjectEventDay(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateProjectEventDayDto,
  ) {
    return this.projectService.createProjectEventDay(projectId, dto);
  }

  @Patch('projects/event-days/:eventDayId')
  updateProjectEventDay(
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateProjectEventDayDto,
  ) {
    return this.projectService.updateProjectEventDay(eventDayId, dto);
  }

  @Delete('projects/event-days/:eventDayId')
  deleteProjectEventDay(
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
  ) {
    return this.projectService.deleteProjectEventDay(eventDayId);
  }

  // ─── Project Films ───────────────────────────────────────────────────

  @Get('projects/:projectId/films')
  getProjectFilms(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectService.getProjectFilms(projectId);
  }

  @Post('projects/:projectId/films')
  createProjectFilm(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateProjectFilmDto,
  ) {
    return this.projectService.createProjectFilm(projectId, dto);
  }

  @Post('projects/:projectId/initialize-from-package/:packageId')
  initializeProjectFromPackage(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('packageId', ParseIntPipe) packageId: number,
  ) {
    return this.projectService.initializeProjectFromPackage(projectId, packageId);
  }

  @Delete('projects/films/:projectFilmId')
  deleteProjectFilm(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
  ) {
    return this.projectService.deleteProjectFilm(projectFilmId);
  }

  // ─── Project Film Scene Schedules ────────────────────────────────────

  @Post('projects/films/:projectFilmId/scenes')
  upsertProjectFilmSceneSchedule(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpsertProjectFilmSceneScheduleDto,
  ) {
    return this.projectService.upsertProjectFilmSceneSchedule(projectFilmId, dto);
  }

  @Post('projects/films/:projectFilmId/scenes/bulk')
  bulkUpsertProjectFilmSceneSchedules(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body(new ValidationPipe({ transform: true })) schedules: UpsertProjectFilmSceneScheduleDto[],
  ) {
    return this.projectService.bulkUpsertProjectFilmSceneSchedules(
      projectFilmId,
      schedules,
    );
  }

  // ─── Resolved Schedule ───────────────────────────────────────────────

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

  // ═══════════════════════════════════════════════════════════════════════
  // Instance CRUD (inquiry-owned schedules)
  // ═══════════════════════════════════════════════════════════════════════
  // These endpoints mirror the existing project endpoints but for inquiry-owned
  // instance data. They use the same underlying service methods via InstanceOwner.

  // ─── Inquiry Event Days ──────────────────────────────────────────────

  @Get('inquiries/:inquiryId/event-days')
  getInquiryEventDays(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
    return this.instanceService.getInstanceEventDays({ inquiry_id: inquiryId });
  }

  @Post('inquiries/:inquiryId/event-days')
  createInquiryEventDay(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateProjectEventDayDto,
  ) {
    return this.instanceService.createInstanceEventDay({ inquiry_id: inquiryId }, dto);
  }

  // update/delete by ID — same as project (the record is found by PK)
  @Patch('inquiries/event-days/:eventDayId')
  updateInquiryEventDay(
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateProjectEventDayDto,
  ) {
    return this.projectService.updateProjectEventDay(eventDayId, dto);
  }

  @Delete('inquiries/event-days/:eventDayId')
  deleteInquiryEventDay(
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
  ) {
    return this.projectService.deleteProjectEventDay(eventDayId);
  }

  // ─── Inquiry Activities ──────────────────────────────────────────────

  @Get('inquiries/:inquiryId/activities/:eventDayId')
  getInquiryActivities(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
  ) {
    return this.instanceService.getInstanceActivities({ inquiry_id: inquiryId }, eventDayId);
  }

  @Get('inquiries/:inquiryId/activities')
  getInquiryAllActivities(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
  ) {
    return this.instanceService.getInstanceAllActivities({ inquiry_id: inquiryId });
  }

  @Post('inquiries/:inquiryId/activities')
  createInquiryActivity(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateProjectActivityDto,
  ) {
    return this.instanceService.createInstanceActivity({ inquiry_id: inquiryId }, dto);
  }

  @Patch('inquiries/activities/:activityId')
  updateInquiryActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateProjectActivityDto,
  ) {
    return this.projectService.updateProjectActivity(activityId, dto);
  }

  @Delete('inquiries/activities/:activityId')
  deleteInquiryActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.projectService.deleteProjectActivity(activityId);
  }

  // ─── Inquiry Films ───────────────────────────────────────────────────

  @Get('inquiries/:inquiryId/films')
  getInquiryFilms(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
    return this.instanceResourceService.getInstanceFilms({ inquiry_id: inquiryId });
  }

  @Post('inquiries/:inquiryId/films')
  createInquiryFilm(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateProjectFilmDto,
  ) {
    return this.instanceResourceService.createInstanceFilm({ inquiry_id: inquiryId }, dto);
  }

  // delete/upsertScene by ID — reuse project endpoints (same table, found by PK)

  // ─── Instance Activity Moments (project + inquiry) ───────────────────
  // GET by activity ID (no owner needed — activity already belongs to an owner)

  @Get('instance/activities/:activityId/moments')
  getInstanceActivityMoments(
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.instanceService.getInstanceActivityMoments(activityId);
  }

  @Post('projects/:projectId/activity-moments')
  createProjectActivityMoment(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceActivityMomentDto,
  ) {
    return this.instanceService.createInstanceActivityMoment({ project_id: projectId }, dto);
  }

  @Post('inquiries/:inquiryId/activity-moments')
  createInquiryActivityMoment(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceActivityMomentDto,
  ) {
    return this.instanceService.createInstanceActivityMoment({ inquiry_id: inquiryId }, dto);
  }

  @Patch('instance/moments/:momentId')
  updateInstanceActivityMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateInstanceActivityMomentDto,
  ) {
    return this.instanceService.updateInstanceActivityMoment(momentId, dto);
  }

  @Delete('instance/moments/:momentId')
  deleteInstanceActivityMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
  ) {
    return this.instanceService.deleteInstanceActivityMoment(momentId);
  }

  @Patch('instance/activities/:activityId/moments/reorder')
  reorderInstanceActivityMoments(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body(new ValidationPipe({ transform: true })) body: { moment_ids: number[] },
  ) {
    return this.instanceService.reorderInstanceActivityMoments(activityId, body.moment_ids);
  }

  // ─── Instance Event Day Subjects (project + inquiry) ─────────────────

  @Get('projects/:projectId/subjects')
  getProjectEventDaySubjects(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto,
  ) {
    return this.instanceResourceService.getInstanceEventDaySubjects(
      { project_id: projectId },
      query.eventDayId,
    );
  }

  @Get('inquiries/:inquiryId/subjects')
  getInquiryEventDaySubjects(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto,
  ) {
    return this.instanceResourceService.getInstanceEventDaySubjects(
      { inquiry_id: inquiryId },
      query.eventDayId,
    );
  }

  @Post('projects/:projectId/subjects')
  createProjectEventDaySubject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceEventDaySubjectDto,
  ) {
    return this.instanceResourceService.createInstanceEventDaySubject({ project_id: projectId }, dto);
  }

  @Post('inquiries/:inquiryId/subjects')
  createInquiryEventDaySubject(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceEventDaySubjectDto,
  ) {
    return this.instanceResourceService.createInstanceEventDaySubject({ inquiry_id: inquiryId }, dto);
  }

  @Patch('instance/subjects/:subjectId')
  updateInstanceEventDaySubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateInstanceEventDaySubjectDto,
  ) {
    return this.instanceResourceService.updateInstanceEventDaySubject(subjectId, dto);
  }

  @Delete('instance/subjects/:subjectId')
  deleteInstanceEventDaySubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    return this.instanceResourceService.deleteInstanceEventDaySubject(subjectId);
  }

  @Post('instance/subjects/:subjectId/activities/:activityId')
  assignInstanceSubjectToActivity(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.instanceResourceService.assignInstanceSubjectToActivity(subjectId, activityId);
  }

  @Delete('instance/subjects/:subjectId/activities/:activityId')
  unassignInstanceSubjectFromActivity(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.instanceResourceService.unassignInstanceSubjectFromActivity(subjectId, activityId);
  }

  // ─── Instance Location Slots (project + inquiry) ─────────────────────

  @Get('projects/:projectId/location-slots')
  getProjectLocationSlots(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto,
  ) {
    return this.instanceResourceService.getInstanceLocationSlots(
      { project_id: projectId },
      query.eventDayId,
    );
  }

  @Get('inquiries/:inquiryId/location-slots')
  getInquiryLocationSlots(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto,
  ) {
    return this.instanceResourceService.getInstanceLocationSlots(
      { inquiry_id: inquiryId },
      query.eventDayId,
    );
  }

  @Post('projects/:projectId/location-slots')
  createProjectLocationSlot(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceLocationSlotDto,
  ) {
    return this.instanceResourceService.createInstanceLocationSlot({ project_id: projectId }, dto);
  }

  @Post('inquiries/:inquiryId/location-slots')
  createInquiryLocationSlot(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceLocationSlotDto,
  ) {
    return this.instanceResourceService.createInstanceLocationSlot({ inquiry_id: inquiryId }, dto);
  }

  @Patch('instance/location-slots/:slotId')
  updateInstanceLocationSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateInstanceLocationSlotDto,
  ) {
    return this.instanceResourceService.updateInstanceLocationSlot(slotId, dto);
  }

  @Delete('instance/location-slots/:slotId')
  deleteInstanceLocationSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.instanceResourceService.deleteInstanceLocationSlot(slotId);
  }

  @Post('instance/location-slots/:slotId/activities/:activityId')
  assignInstanceLocationSlotToActivity(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.instanceResourceService.assignInstanceLocationSlotToActivity(slotId, activityId);
  }

  @Delete('instance/location-slots/:slotId/activities/:activityId')
  unassignInstanceLocationSlotFromActivity(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.instanceResourceService.unassignInstanceLocationSlotFromActivity(slotId, activityId);
  }

  // ─── Instance Crew Slots (project + inquiry) ────────────────────────

  @Get('projects/:projectId/crew-slots')
  getProjectDayCrewSlots(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto,
  ) {
    return this.instanceCrewService.getInstanceDayCrewSlots(
      { project_id: projectId },
      query.eventDayId,
    );
  }

  @Get('inquiries/:inquiryId/crew-slots')
  getInquiryDayCrewSlots(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto,
  ) {
    return this.instanceCrewService.getInstanceDayCrewSlots(
      { inquiry_id: inquiryId },
      query.eventDayId,
    );
  }

  @Post('projects/:projectId/crew-slots')
  createProjectDayCrewSlot(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceCrewSlotDto,
  ) {
    return this.instanceCrewService.createInstanceCrewSlot({ project_id: projectId }, dto);
  }

  @Post('inquiries/:inquiryId/crew-slots')
  createInquiryDayCrewSlot(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceCrewSlotDto,
  ) {
    return this.instanceCrewService.createInstanceCrewSlot({ inquiry_id: inquiryId }, dto);
  }

  @Patch('instance/crew-slots/:crewSlotId')
  updateInstanceCrewSlot(
    @Param('crewSlotId', ParseIntPipe) crewSlotId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateInstanceCrewSlotDto,
  ) {
    return this.instanceCrewService.updateInstanceCrewSlot(crewSlotId, dto);
  }

  @Patch('instance/crew-slots/:crewSlotId/assign')
  assignInstanceCrewToSlot(
    @Param('crewSlotId', ParseIntPipe) crewSlotId: number,
    @Body(new ValidationPipe({ transform: true })) dto: { crew_id: number | null },
  ) {
    return this.instanceCrewService.assignInstanceCrewToSlot(crewSlotId, dto.crew_id);
  }

  @Delete('instance/crew-slots/:crewSlotId')
  removeInstanceCrewSlot(
    @Param('crewSlotId', ParseIntPipe) crewSlotId: number,
  ) {
    return this.instanceCrewService.removeInstanceCrewSlot(crewSlotId);
  }

  @Post('instance/crew-slots/:crewSlotId/equipment')
  setInstanceCrewSlotEquipment(
    @Param('crewSlotId', ParseIntPipe) crewSlotId: number,
    @Body(new ValidationPipe({ transform: true })) dto: { equipment: { equipment_id: number; is_primary: boolean }[] },
  ) {
    return this.instanceCrewService.setInstanceCrewSlotEquipment(crewSlotId, dto.equipment);
  }

  @Post('instance/crew-slots/:crewSlotId/activities/:activityId')
  assignInstanceCrewSlotToActivity(
    @Param('crewSlotId', ParseIntPipe) crewSlotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.instanceCrewService.assignInstanceCrewSlotToActivity(crewSlotId, activityId);
  }

  @Delete('instance/crew-slots/:crewSlotId/activities/:activityId')
  unassignInstanceCrewSlotFromActivity(
    @Param('crewSlotId', ParseIntPipe) crewSlotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.instanceCrewService.unassignInstanceCrewSlotFromActivity(crewSlotId, activityId);
  }

  // ─── Project Instance Event Days (enhanced) ──────────────────────────
  // These wrap the instance methods with project owner, providing richer includes

  @Get('projects/:projectId/instance-event-days')
  getProjectInstanceEventDays(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.instanceService.getInstanceEventDays({ project_id: projectId });
  }

  @Get('projects/:projectId/all-activities')
  getProjectAllActivities(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.instanceService.getInstanceAllActivities({ project_id: projectId });
  }
}
