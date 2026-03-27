import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScheduleInstanceService } from '../services/schedule-instance.service';
import { ScheduleInstanceResourceService } from '../services/schedule-instance-resource.service';
import {
  CreateProjectEventDayDto, UpdateProjectEventDayDto,
  CreateProjectActivityDto, UpdateProjectActivityDto, CreateProjectFilmDto,
  CreateInstanceActivityMomentDto, UpdateInstanceActivityMomentDto,
} from '../dto';

@Controller('api/schedule')
@UseGuards(AuthGuard('jwt'))
export class ScheduleInstanceController {
  constructor(
    private readonly instanceService: ScheduleInstanceService,
    private readonly resourceService: ScheduleInstanceResourceService,
  ) {}

  @Get('inquiries/:inquiryId/event-days')
  getInquiryEventDays(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
    return this.instanceService.getInstanceEventDays({ inquiry_id: inquiryId });
  }

  @Post('inquiries/:inquiryId/event-days')
  createInquiryEventDay(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateProjectEventDayDto) {
    return this.instanceService.createInstanceEventDay({ inquiry_id: inquiryId }, dto);
  }

  @Patch('inquiries/event-days/:eventDayId')
  updateInquiryEventDay(@Param('eventDayId', ParseIntPipe) eventDayId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateProjectEventDayDto) {
    return this.instanceService.updateProjectEventDay(eventDayId, dto);
  }

  @Delete('inquiries/event-days/:eventDayId')
  deleteInquiryEventDay(@Param('eventDayId', ParseIntPipe) eventDayId: number) {
    return this.instanceService.deleteProjectEventDay(eventDayId);
  }

  @Get('inquiries/:inquiryId/activities/:eventDayId')
  getInquiryActivities(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Param('eventDayId', ParseIntPipe) eventDayId: number) {
    return this.instanceService.getInstanceActivities({ inquiry_id: inquiryId }, eventDayId);
  }

  @Get('inquiries/:inquiryId/activities')
  getInquiryAllActivities(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
    return this.instanceService.getInstanceAllActivities({ inquiry_id: inquiryId });
  }

  @Post('inquiries/:inquiryId/activities')
  createInquiryActivity(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateProjectActivityDto) {
    return this.instanceService.createInstanceActivity({ inquiry_id: inquiryId }, dto);
  }

  @Patch('inquiries/activities/:activityId')
  updateInquiryActivity(@Param('activityId', ParseIntPipe) activityId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateProjectActivityDto) {
    return this.instanceService.updateProjectActivity(activityId, dto);
  }

  @Delete('inquiries/activities/:activityId')
  deleteInquiryActivity(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.instanceService.deleteProjectActivity(activityId);
  }

  @Get('inquiries/:inquiryId/films')
  getInquiryFilms(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
    return this.resourceService.getInstanceFilms({ inquiry_id: inquiryId });
  }

  @Post('inquiries/:inquiryId/films')
  createInquiryFilm(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateProjectFilmDto) {
    return this.resourceService.createInstanceFilm({ inquiry_id: inquiryId }, dto);
  }

  @Get('instance/activities/:activityId/moments')
  getInstanceActivityMoments(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.instanceService.getInstanceActivityMoments(activityId);
  }

  @Post('projects/:projectId/activity-moments')
  createProjectActivityMoment(@Param('projectId', ParseIntPipe) projectId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceActivityMomentDto) {
    return this.instanceService.createInstanceActivityMoment({ project_id: projectId }, dto);
  }

  @Post('inquiries/:inquiryId/activity-moments')
  createInquiryActivityMoment(@Param('inquiryId', ParseIntPipe) inquiryId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceActivityMomentDto) {
    return this.instanceService.createInstanceActivityMoment({ inquiry_id: inquiryId }, dto);
  }

  @Patch('instance/moments/:momentId')
  updateInstanceActivityMoment(@Param('momentId', ParseIntPipe) momentId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateInstanceActivityMomentDto) {
    return this.instanceService.updateInstanceActivityMoment(momentId, dto);
  }

  @Delete('instance/moments/:momentId')
  deleteInstanceActivityMoment(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.instanceService.deleteInstanceActivityMoment(momentId);
  }

  @Patch('instance/activities/:activityId/moments/reorder')
  reorderInstanceActivityMoments(@Param('activityId', ParseIntPipe) activityId: number, @Body(new ValidationPipe({ transform: true })) body: { moment_ids: number[] }) {
    return this.instanceService.reorderInstanceActivityMoments(activityId, body.moment_ids);
  }
}
