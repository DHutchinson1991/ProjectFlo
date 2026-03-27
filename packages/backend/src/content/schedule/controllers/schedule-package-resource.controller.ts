import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SchedulePackageResourceService } from '../services/schedule-package-resource.service';
import {
  CreatePackageDaySubjectDto, UpdatePackageDaySubjectDto,
  CreatePackageEventDayLocationDto, UpdatePackageEventDayLocationDto,
  CreatePackageLocationSlotDto,
} from '../dto';
import { EventDayIdQueryDto } from '../dto/event-day-id-query.dto';

@Controller('api/schedule')
@UseGuards(AuthGuard('jwt'))
export class SchedulePackageResourceController {
  constructor(
    private readonly resourceService: SchedulePackageResourceService,
  ) {}

  @Get('packages/:packageId/subjects')
  getPackageEventDaySubjects(@Param('packageId', ParseIntPipe) packageId: number, @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto) {
    return this.resourceService.getPackageEventDaySubjects(packageId, query.eventDayId);
  }

  @Post('packages/:packageId/subjects')
  createPackageEventDaySubject(@Param('packageId', ParseIntPipe) packageId: number, @Body(new ValidationPipe({ transform: true })) dto: CreatePackageDaySubjectDto) {
    return this.resourceService.createPackageEventDaySubject(packageId, dto);
  }

  @Patch('packages/subjects/:subjectId')
  updatePackageEventDaySubject(@Param('subjectId', ParseIntPipe) subjectId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageDaySubjectDto) {
    return this.resourceService.updatePackageEventDaySubject(subjectId, dto);
  }

  @Delete('packages/subjects/:subjectId')
  deletePackageEventDaySubject(@Param('subjectId', ParseIntPipe) subjectId: number) {
    return this.resourceService.deletePackageEventDaySubject(subjectId);
  }

  @Post('packages/subjects/:subjectId/activities/:activityId')
  assignSubjectToActivity(@Param('subjectId', ParseIntPipe) subjectId: number, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.resourceService.assignSubjectToActivity(subjectId, activityId);
  }

  @Delete('packages/subjects/:subjectId/activities/:activityId')
  unassignSubjectFromActivity(@Param('subjectId', ParseIntPipe) subjectId: number, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.resourceService.unassignSubjectFromActivity(subjectId, activityId);
  }

  @Get('packages/:packageId/locations')
  getPackageEventDayLocations(@Param('packageId', ParseIntPipe) packageId: number, @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto) {
    return this.resourceService.getPackageEventDayLocations(packageId, query.eventDayId);
  }

  @Post('packages/:packageId/locations')
  createPackageEventDayLocation(@Param('packageId', ParseIntPipe) packageId: number, @Body(new ValidationPipe({ transform: true })) dto: CreatePackageEventDayLocationDto) {
    return this.resourceService.createPackageEventDayLocation(packageId, dto);
  }

  @Patch('packages/locations/:locationId')
  updatePackageEventDayLocation(@Param('locationId', ParseIntPipe) locationId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageEventDayLocationDto) {
    return this.resourceService.updatePackageEventDayLocation(locationId, dto);
  }

  @Delete('packages/locations/:locationId')
  deletePackageEventDayLocation(@Param('locationId', ParseIntPipe) locationId: number) {
    return this.resourceService.deletePackageEventDayLocation(locationId);
  }

  @Get('packages/:packageId/location-slots')
  getPackageLocationSlots(@Param('packageId', ParseIntPipe) packageId: number, @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto) {
    return this.resourceService.getPackageLocationSlots(packageId, query.eventDayId);
  }

  @Post('packages/:packageId/location-slots')
  createPackageLocationSlot(@Param('packageId', ParseIntPipe) packageId: number, @Body(new ValidationPipe({ transform: true })) dto: CreatePackageLocationSlotDto) {
    return this.resourceService.createPackageLocationSlot(packageId, dto);
  }

  @Delete('packages/location-slots/:slotId')
  deletePackageLocationSlot(@Param('slotId', ParseIntPipe) slotId: number) {
    return this.resourceService.deletePackageLocationSlot(slotId);
  }

  @Post('packages/location-slots/:slotId/activities/:activityId')
  assignLocationSlotToActivity(@Param('slotId', ParseIntPipe) slotId: number, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.resourceService.assignLocationSlotToActivity(slotId, activityId);
  }

  @Delete('packages/location-slots/:slotId/activities/:activityId')
  unassignLocationSlotFromActivity(@Param('slotId', ParseIntPipe) slotId: number, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.resourceService.unassignLocationSlotFromActivity(slotId, activityId);
  }
}
