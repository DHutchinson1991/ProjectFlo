import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SchedulePackageService } from '../services/schedule-package.service';
import { SchedulePackageActivityService } from '../services/schedule-package-activity.service';
import { SchedulePackageContentCreationService } from '../services/schedule-package-content-creation.service';
import { SchedulePackageAccessService } from '../services/schedule-package-access.service';
import {
  AddPackageEventDayDto, SetPackageEventDaysDto,
  CreatePackageFilmContentDto,
  CreatePackageFilmDto, UpdatePackageFilmDto, UpsertPackageFilmSceneScheduleDto,
  CreatePackageActivityDto, UpdatePackageActivityDto,
  CreatePackageActivityMomentDto, UpdatePackageActivityMomentDto, BulkCreatePackageActivityMomentsDto,
} from '../dto';
import { BrandId } from '../../../platform/auth/decorators/brand-id.decorator';

@Controller('api/schedule')
@UseGuards(AuthGuard('jwt'))
export class SchedulePackageController {
  constructor(
    private readonly packageService: SchedulePackageService,
    private readonly activityService: SchedulePackageActivityService,
    private readonly contentCreationService: SchedulePackageContentCreationService,
    private readonly packageAccess: SchedulePackageAccessService,
  ) {}

  @Get('packages/:packageId/summary')
  async getPackageScheduleSummary(
    @Param('packageId', ParseIntPipe) packageId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.packageService.getPackageScheduleSummary(packageId);
  }

  @Get('packages/:packageId/event-days')
  async getPackageEventDays(
    @Param('packageId', ParseIntPipe) packageId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.packageService.getPackageEventDays(packageId);
  }

  @Post('packages/:packageId/event-days')
  async addPackageEventDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: AddPackageEventDayDto,
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.packageService.addPackageEventDay(packageId, dto);
  }

  @Post('packages/:packageId/event-days/set')
  async setPackageEventDays(
    @Param('packageId', ParseIntPipe) packageId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: SetPackageEventDaysDto,
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.packageService.setPackageEventDays(packageId, dto);
  }

  @Delete('packages/:packageId/event-days/:eventDayId')
  async removePackageEventDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Param('eventDayId', ParseIntPipe) eventDayId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.packageService.removePackageEventDay(packageId, eventDayId);
  }

  @Get('packages/:packageId/films')
  async getPackageFilms(
    @Param('packageId', ParseIntPipe) packageId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.packageService.getPackageFilms(packageId);
  }

  @Post('packages/:packageId/films')
  async createPackageFilm(
    @Param('packageId', ParseIntPipe) packageId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageFilmDto,
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.packageService.createPackageFilm(packageId, dto);
  }

  @Post('packages/:packageId/films/create-content')
  createPackageFilmContent(
    @Param('packageId', ParseIntPipe) packageId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageFilmContentDto,
  ) {
    return this.contentCreationService.createForPackage(packageId, brandId, dto);
  }

  @Patch('packages/films/:packageFilmId')
  async updatePackageFilm(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageFilmDto,
  ) {
    await this.packageAccess.assertPackageFilm(packageFilmId, brandId);
    return this.packageService.updatePackageFilm(packageFilmId, dto);
  }

  @Delete('packages/films/:packageFilmId')
  async deletePackageFilm(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertPackageFilm(packageFilmId, brandId);
    return this.packageService.deletePackageFilm(packageFilmId);
  }

  @Get('packages/films/:packageFilmId/schedule')
  async getPackageFilmSchedule(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertPackageFilm(packageFilmId, brandId);
    return this.packageService.getPackageFilmSchedule(packageFilmId);
  }

  @Post('packages/films/:packageFilmId/scenes')
  async upsertPackageFilmSceneSchedule(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpsertPackageFilmSceneScheduleDto,
  ) {
    await this.packageAccess.assertPackageFilm(packageFilmId, brandId);
    return this.packageService.upsertPackageFilmSceneSchedule(packageFilmId, dto);
  }

  @Post('packages/films/:packageFilmId/scenes/bulk')
  async bulkUpsertPackageFilmSceneSchedules(
    @Param('packageFilmId', ParseIntPipe) packageFilmId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) schedules: UpsertPackageFilmSceneScheduleDto[],
  ) {
    await this.packageAccess.assertPackageFilm(packageFilmId, brandId);
    return this.packageService.bulkUpsertPackageFilmSceneSchedules(packageFilmId, schedules);
  }

  @Get('packages/:packageId/activities')
  async getPackageActivities(
    @Param('packageId', ParseIntPipe) packageId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.activityService.getPackageActivities(packageId);
  }

  @Get('packages/:packageId/activities/day/:packageEventDayId')
  async getPackageActivitiesByDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Param('packageEventDayId', ParseIntPipe) packageEventDayId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.activityService.getPackageActivitiesByDay(packageId, packageEventDayId);
  }

  @Post('packages/:packageId/activities')
  async createPackageActivity(
    @Param('packageId', ParseIntPipe) packageId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageActivityDto,
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.activityService.createPackageActivity(packageId, dto);
  }

  @Patch('packages/activities/:activityId')
  async updatePackageActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageActivityDto,
  ) {
    await this.packageAccess.assertActivity(activityId, brandId);
    return this.activityService.updatePackageActivity(activityId, dto);
  }

  @Delete('packages/activities/:activityId')
  async deletePackageActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertActivity(activityId, brandId);
    return this.activityService.deletePackageActivity(activityId);
  }

  @Post('packages/:packageId/activities/day/:packageEventDayId/reorder')
  async reorderPackageActivities(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Param('packageEventDayId', ParseIntPipe) packageEventDayId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) body: { activity_ids: number[] },
  ) {
    await this.packageAccess.assertPackage(packageId, brandId);
    return this.activityService.reorderPackageActivities(packageId, packageEventDayId, body.activity_ids);
  }

  @Get('packages/activities/:activityId/moments')
  async getActivityMoments(
    @Param('activityId', ParseIntPipe) activityId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertActivity(activityId, brandId);
    return this.activityService.getActivityMoments(activityId);
  }

  @Post('packages/activities/:activityId/moments')
  async createActivityMoment(
    @Param('activityId', ParseIntPipe) activityId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageActivityMomentDto,
  ) {
    await this.packageAccess.assertActivity(activityId, brandId);
    return this.activityService.createActivityMoment(activityId, dto);
  }

  @Post('packages/activities/:activityId/moments/bulk')
  async bulkCreateActivityMoments(
    @Param('activityId', ParseIntPipe) activityId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: BulkCreatePackageActivityMomentsDto,
  ) {
    await this.packageAccess.assertActivity(activityId, brandId);
    return this.activityService.bulkCreateActivityMoments(activityId, dto);
  }

  @Patch('packages/activities/moments/:momentId')
  async updateActivityMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageActivityMomentDto,
  ) {
    await this.packageAccess.assertActivityMoment(momentId, brandId);
    return this.activityService.updateActivityMoment(momentId, dto);
  }

  @Delete('packages/activities/moments/:momentId')
  async deleteActivityMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
    @BrandId() brandId: number,
  ) {
    await this.packageAccess.assertActivityMoment(momentId, brandId);
    return this.activityService.deleteActivityMoment(momentId);
  }

  @Post('packages/activities/:activityId/moments/reorder')
  async reorderActivityMoments(
    @Param('activityId', ParseIntPipe) activityId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) body: { moment_ids: number[] },
  ) {
    await this.packageAccess.assertActivity(activityId, brandId);
    return this.activityService.reorderActivityMoments(activityId, body.moment_ids);
  }
}
