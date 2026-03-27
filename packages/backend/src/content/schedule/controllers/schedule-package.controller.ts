import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SchedulePackageService } from '../services/schedule-package.service';
import { SchedulePackageActivityService } from '../services/schedule-package-activity.service';
import {
  AddPackageEventDayDto, SetPackageEventDaysDto,
  CreatePackageFilmDto, UpdatePackageFilmDto, UpsertPackageFilmSceneScheduleDto,
  CreatePackageActivityDto, UpdatePackageActivityDto,
  CreatePackageActivityMomentDto, UpdatePackageActivityMomentDto, BulkCreatePackageActivityMomentsDto,
} from '../dto';

@Controller('api/schedule')
@UseGuards(AuthGuard('jwt'))
export class SchedulePackageController {
  constructor(
    private readonly packageService: SchedulePackageService,
    private readonly activityService: SchedulePackageActivityService,
  ) {}

  @Get('packages/:packageId/summary')
  getPackageScheduleSummary(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.packageService.getPackageScheduleSummary(packageId);
  }

  @Get('packages/:packageId/event-days')
  getPackageEventDays(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.packageService.getPackageEventDays(packageId);
  }

  @Post('packages/:packageId/event-days')
  addPackageEventDay(@Param('packageId', ParseIntPipe) packageId: number, @Body(new ValidationPipe({ transform: true })) dto: AddPackageEventDayDto) {
    return this.packageService.addPackageEventDay(packageId, dto);
  }

  @Post('packages/:packageId/event-days/set')
  setPackageEventDays(@Param('packageId', ParseIntPipe) packageId: number, @Body(new ValidationPipe({ transform: true })) dto: SetPackageEventDaysDto) {
    return this.packageService.setPackageEventDays(packageId, dto);
  }

  @Delete('packages/:packageId/event-days/:eventDayId')
  removePackageEventDay(@Param('packageId', ParseIntPipe) packageId: number, @Param('eventDayId', ParseIntPipe) eventDayId: number) {
    return this.packageService.removePackageEventDay(packageId, eventDayId);
  }

  @Get('packages/:packageId/films')
  getPackageFilms(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.packageService.getPackageFilms(packageId);
  }

  @Post('packages/:packageId/films')
  createPackageFilm(@Param('packageId', ParseIntPipe) packageId: number, @Body(new ValidationPipe({ transform: true })) dto: CreatePackageFilmDto) {
    return this.packageService.createPackageFilm(packageId, dto);
  }

  @Patch('packages/films/:packageFilmId')
  updatePackageFilm(@Param('packageFilmId', ParseIntPipe) packageFilmId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageFilmDto) {
    return this.packageService.updatePackageFilm(packageFilmId, dto);
  }

  @Delete('packages/films/:packageFilmId')
  deletePackageFilm(@Param('packageFilmId', ParseIntPipe) packageFilmId: number) {
    return this.packageService.deletePackageFilm(packageFilmId);
  }

  @Get('packages/films/:packageFilmId/schedule')
  getPackageFilmSchedule(@Param('packageFilmId', ParseIntPipe) packageFilmId: number) {
    return this.packageService.getPackageFilmSchedule(packageFilmId);
  }

  @Post('packages/films/:packageFilmId/scenes')
  upsertPackageFilmSceneSchedule(@Param('packageFilmId', ParseIntPipe) packageFilmId: number, @Body(new ValidationPipe({ transform: true })) dto: UpsertPackageFilmSceneScheduleDto) {
    return this.packageService.upsertPackageFilmSceneSchedule(packageFilmId, dto);
  }

  @Post('packages/films/:packageFilmId/scenes/bulk')
  bulkUpsertPackageFilmSceneSchedules(@Param('packageFilmId', ParseIntPipe) packageFilmId: number, @Body(new ValidationPipe({ transform: true })) schedules: UpsertPackageFilmSceneScheduleDto[]) {
    return this.packageService.bulkUpsertPackageFilmSceneSchedules(packageFilmId, schedules);
  }

  @Get('packages/:packageId/activities')
  getPackageActivities(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.activityService.getPackageActivities(packageId);
  }

  @Get('packages/:packageId/activities/day/:packageEventDayId')
  getPackageActivitiesByDay(@Param('packageId', ParseIntPipe) packageId: number, @Param('packageEventDayId', ParseIntPipe) packageEventDayId: number) {
    return this.activityService.getPackageActivitiesByDay(packageId, packageEventDayId);
  }

  @Post('packages/:packageId/activities')
  createPackageActivity(@Param('packageId', ParseIntPipe) packageId: number, @Body(new ValidationPipe({ transform: true })) dto: CreatePackageActivityDto) {
    return this.activityService.createPackageActivity(packageId, dto);
  }

  @Patch('packages/activities/:activityId')
  updatePackageActivity(@Param('activityId', ParseIntPipe) activityId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageActivityDto) {
    return this.activityService.updatePackageActivity(activityId, dto);
  }

  @Delete('packages/activities/:activityId')
  deletePackageActivity(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.activityService.deletePackageActivity(activityId);
  }

  @Post('packages/:packageId/activities/day/:packageEventDayId/reorder')
  reorderPackageActivities(@Param('packageId', ParseIntPipe) packageId: number, @Param('packageEventDayId', ParseIntPipe) packageEventDayId: number, @Body(new ValidationPipe({ transform: true })) body: { activity_ids: number[] }) {
    return this.activityService.reorderPackageActivities(packageId, packageEventDayId, body.activity_ids);
  }

  @Get('packages/activities/:activityId/moments')
  getActivityMoments(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.activityService.getActivityMoments(activityId);
  }

  @Post('packages/activities/:activityId/moments')
  createActivityMoment(@Param('activityId', ParseIntPipe) activityId: number, @Body(new ValidationPipe({ transform: true })) dto: CreatePackageActivityMomentDto) {
    return this.activityService.createActivityMoment(activityId, dto);
  }

  @Post('packages/activities/:activityId/moments/bulk')
  bulkCreateActivityMoments(@Param('activityId', ParseIntPipe) activityId: number, @Body(new ValidationPipe({ transform: true })) dto: BulkCreatePackageActivityMomentsDto) {
    return this.activityService.bulkCreateActivityMoments(activityId, dto);
  }

  @Patch('packages/activities/moments/:momentId')
  updateActivityMoment(@Param('momentId', ParseIntPipe) momentId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageActivityMomentDto) {
    return this.activityService.updateActivityMoment(momentId, dto);
  }

  @Delete('packages/activities/moments/:momentId')
  deleteActivityMoment(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.activityService.deleteActivityMoment(momentId);
  }

  @Post('packages/activities/:activityId/moments/reorder')
  reorderActivityMoments(@Param('activityId', ParseIntPipe) activityId: number, @Body(new ValidationPipe({ transform: true })) body: { moment_ids: number[] }) {
    return this.activityService.reorderActivityMoments(activityId, body.moment_ids);
  }
}
