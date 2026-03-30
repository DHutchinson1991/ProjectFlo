import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScheduleInstanceService } from '../services/schedule-instance.service';
import { ScheduleInstanceResourceService } from '../services/schedule-instance-resource.service';
import { ScheduleInstanceCrewSlotsService } from '../services/schedule-instance-crew-slots.service';
import { ScheduleDiffService } from '../services/schedule-diff.service';
import {
  CreateInstanceEventDaySubjectDto, UpdateInstanceEventDaySubjectDto,
  CreateInstanceLocationSlotDto, UpdateInstanceLocationSlotDto,
  CreateInstanceCrewSlotDto, UpdateInstanceCrewSlotDto,
} from '../dto';
import { EventDayIdQueryDto } from '../dto/event-day-id-query.dto';

@Controller('api/schedule')
@UseGuards(AuthGuard('jwt'))
export class ScheduleInstanceResourceController {
  constructor(
    private readonly instanceService: ScheduleInstanceService,
    private readonly resourceService: ScheduleInstanceResourceService,
    private readonly crewSlotsService: ScheduleInstanceCrewSlotsService,
    private readonly diffService: ScheduleDiffService,
  ) {}

  @Get('projects/:projectId/subjects')
  getProjectEventDaySubjects(@Param('projectId', ParseIntPipe) projectId: number, @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto) {
    return this.resourceService.getInstanceEventDaySubjects({ project_id: projectId }, query.eventDayId);
  }

  @Get('inquiries/:inquiryId/subjects')
  getInquiryEventDaySubjects(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto) {
    return this.resourceService.getInstanceEventDaySubjects({ inquiry_id: inquiryId }, query.eventDayId);
  }

  @Post('projects/:projectId/subjects')
  createProjectEventDaySubject(@Param('projectId', ParseIntPipe) projectId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceEventDaySubjectDto) {
    return this.resourceService.createInstanceEventDaySubject({ project_id: projectId }, dto);
  }

  @Post('inquiries/:inquiryId/subjects')
  createInquiryEventDaySubject(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceEventDaySubjectDto) {
    return this.resourceService.createInstanceEventDaySubject({ inquiry_id: inquiryId }, dto);
  }

  @Patch('instance/subjects/:subjectId')
  updateInstanceEventDaySubject(@Param('subjectId', ParseIntPipe) subjectId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateInstanceEventDaySubjectDto) {
    return this.resourceService.updateInstanceEventDaySubject(subjectId, dto);
  }

  @Delete('instance/subjects/:subjectId')
  deleteInstanceEventDaySubject(@Param('subjectId', ParseIntPipe) subjectId: number) {
    return this.resourceService.deleteInstanceEventDaySubject(subjectId);
  }

  @Post('instance/subjects/:subjectId/activities/:activityId')
  assignInstanceSubjectToActivity(@Param('subjectId', ParseIntPipe) subjectId: number, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.resourceService.assignInstanceSubjectToActivity(subjectId, activityId);
  }

  @Delete('instance/subjects/:subjectId/activities/:activityId')
  unassignInstanceSubjectFromActivity(@Param('subjectId', ParseIntPipe) subjectId: number, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.resourceService.unassignInstanceSubjectFromActivity(subjectId, activityId);
  }

  @Get('projects/:projectId/location-slots')
  getProjectLocationSlots(@Param('projectId', ParseIntPipe) projectId: number, @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto) {
    return this.resourceService.getInstanceLocationSlots({ project_id: projectId }, query.eventDayId);
  }

  @Get('inquiries/:inquiryId/location-slots')
  getInquiryLocationSlots(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto) {
    return this.resourceService.getInstanceLocationSlots({ inquiry_id: inquiryId }, query.eventDayId);
  }

  @Post('projects/:projectId/location-slots')
  createProjectLocationSlot(@Param('projectId', ParseIntPipe) projectId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceLocationSlotDto) {
    return this.resourceService.createInstanceLocationSlot({ project_id: projectId }, dto);
  }

  @Post('inquiries/:inquiryId/location-slots')
  createInquiryLocationSlot(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceLocationSlotDto) {
    return this.resourceService.createInstanceLocationSlot({ inquiry_id: inquiryId }, dto);
  }

  @Patch('instance/location-slots/:slotId')
  updateInstanceLocationSlot(@Param('slotId', ParseIntPipe) slotId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateInstanceLocationSlotDto) {
    return this.resourceService.updateInstanceLocationSlot(slotId, dto);
  }

  @Delete('instance/location-slots/:slotId')
  deleteInstanceLocationSlot(@Param('slotId', ParseIntPipe) slotId: number) {
    return this.resourceService.deleteInstanceLocationSlot(slotId);
  }

  @Post('instance/location-slots/:slotId/activities/:activityId')
  assignInstanceLocationSlotToActivity(@Param('slotId', ParseIntPipe) slotId: number, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.resourceService.assignInstanceLocationSlotToActivity(slotId, activityId);
  }

  @Delete('instance/location-slots/:slotId/activities/:activityId')
  unassignInstanceLocationSlotFromActivity(@Param('slotId', ParseIntPipe) slotId: number, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.resourceService.unassignInstanceLocationSlotFromActivity(slotId, activityId);
  }

  @Get('projects/:projectId/crew-slots')
  getProjectDayCrewSlots(@Param('projectId', ParseIntPipe) projectId: number, @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto) {
    return this.crewSlotsService.getInstanceDayCrewSlots({ project_id: projectId }, query.eventDayId);
  }

  @Get('inquiries/:inquiryId/crew-slots')
  getInquiryDayCrewSlots(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Query(new ValidationPipe({ transform: true })) query: EventDayIdQueryDto) {
    return this.crewSlotsService.getInstanceDayCrewSlots({ inquiry_id: inquiryId }, query.eventDayId);
  }

  @Post('projects/:projectId/crew-slots')
  createProjectDayCrewSlot(@Param('projectId', ParseIntPipe) projectId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceCrewSlotDto) {
    return this.crewSlotsService.createInstanceCrewSlot({ project_id: projectId }, dto);
  }

  @Post('inquiries/:inquiryId/crew-slots')
  createInquiryDayCrewSlot(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceCrewSlotDto) {
    return this.crewSlotsService.createInstanceCrewSlot({ inquiry_id: inquiryId }, dto);
  }

  @Patch('instance/crew-slots/:crewSlotId')
  updateInstanceCrewSlot(@Param('crewSlotId', ParseIntPipe) crewSlotId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateInstanceCrewSlotDto) {
    return this.crewSlotsService.updateInstanceCrewSlot(crewSlotId, dto);
  }

  @Patch('instance/crew-slots/:crewSlotId/assign')
  assignInstanceCrewToSlot(@Param('crewSlotId', ParseIntPipe) crewSlotId: number, @Body(new ValidationPipe({ transform: true })) dto: { crew_id: number | null }) {
    return this.crewSlotsService.assignInstanceCrewToSlot(crewSlotId, dto.crew_id);
  }

  @Delete('instance/crew-slots/:crewSlotId')
  removeInstanceCrewSlot(@Param('crewSlotId', ParseIntPipe) crewSlotId: number) {
    return this.crewSlotsService.removeInstanceCrewSlot(crewSlotId);
  }

  @Post('instance/crew-slots/:crewSlotId/equipment')
  setInstanceCrewSlotEquipment(@Param('crewSlotId', ParseIntPipe) crewSlotId: number, @Body(new ValidationPipe({ transform: true })) dto: { equipment: { equipment_id: number; is_primary: boolean }[] }) {
    return this.crewSlotsService.setInstanceCrewSlotEquipment(crewSlotId, dto.equipment);
  }

  @Post('instance/crew-slots/:crewSlotId/activities/:activityId')
  assignInstanceCrewSlotToActivity(@Param('crewSlotId', ParseIntPipe) crewSlotId: number, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.crewSlotsService.assignInstanceCrewSlotToActivity(crewSlotId, activityId);
  }

  @Delete('instance/crew-slots/:crewSlotId/activities/:activityId')
  unassignInstanceCrewSlotFromActivity(@Param('crewSlotId', ParseIntPipe) crewSlotId: number, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.crewSlotsService.unassignInstanceCrewSlotFromActivity(crewSlotId, activityId);
  }

  @Get('projects/:projectId/instance-event-days')
  getProjectInstanceEventDays(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.instanceService.getInstanceEventDays({ project_id: projectId });
  }

  @Get('projects/:projectId/all-activities')
  getProjectAllActivities(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.instanceService.getInstanceAllActivities({ project_id: projectId });
  }

  @Get('inquiries/:inquiryId/diff')
  getInquiryScheduleDiff(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
    return this.diffService.getScheduleDiff({ inquiry_id: inquiryId });
  }
}
