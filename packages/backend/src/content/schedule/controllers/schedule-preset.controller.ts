import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SchedulePresetService } from '../services/schedule-preset.service';
import { ScheduleFilmService } from '../services/schedule-film.service';
import {
  CreateEventDayDto, UpdateEventDayDto,
  CreateEventDayActivityDto, UpdateEventDayActivityDto,
  CreatePresetMomentDto, UpdatePresetMomentDto,
  UpsertSchedulePresetDto, RenameSchedulePresetDto,
  CreateFilmSceneScheduleDto, UpdateFilmSceneScheduleDto, BulkUpsertFilmSceneScheduleDto,
} from '../dto';

@Controller('api/schedule')
@UseGuards(AuthGuard('jwt'))
export class SchedulePresetController {
  constructor(
    private readonly presetService: SchedulePresetService,
    private readonly filmService: ScheduleFilmService,
  ) {}

  @Get('presets/brand/:brandId')
  getSchedulePresets(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.presetService.getSchedulePresets(brandId);
  }

  @Post('presets/brand/:brandId')
  upsertSchedulePreset(@Param('brandId', ParseIntPipe) brandId: number, @Body(new ValidationPipe({ transform: true })) dto: UpsertSchedulePresetDto) {
    return this.presetService.upsertSchedulePreset(brandId, dto);
  }

  @Patch('presets/:presetId/brand/:brandId/rename')
  renameSchedulePreset(@Param('presetId', ParseIntPipe) presetId: number, @Param('brandId', ParseIntPipe) brandId: number, @Body(new ValidationPipe({ transform: true })) dto: RenameSchedulePresetDto) {
    return this.presetService.renameSchedulePreset(brandId, presetId, dto.name);
  }

  @Delete('presets/:presetId/brand/:brandId')
  deleteSchedulePreset(@Param('presetId', ParseIntPipe) presetId: number, @Param('brandId', ParseIntPipe) brandId: number) {
    return this.presetService.deleteSchedulePreset(brandId, presetId);
  }

  @Get('event-days/brand/:brandId')
  getEventDays(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.presetService.findAllEventDays(brandId);
  }

  @Post('event-days/brand/:brandId')
  createEventDay(@Param('brandId', ParseIntPipe) brandId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateEventDayDto) {
    return this.presetService.createEventDay(brandId, dto);
  }

  @Patch('event-days/:id/brand/:brandId')
  updateEventDay(@Param('id', ParseIntPipe) id: number, @Param('brandId', ParseIntPipe) brandId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateEventDayDto) {
    return this.presetService.updateEventDay(id, brandId, dto);
  }

  @Delete('event-days/:id/brand/:brandId')
  deleteEventDay(@Param('id', ParseIntPipe) id: number, @Param('brandId', ParseIntPipe) brandId: number) {
    return this.presetService.deleteEventDay(id, brandId);
  }

  @Get('event-days/:eventDayId/activity-presets')
  getActivityPresets(@Param('eventDayId', ParseIntPipe) eventDayId: number) {
    return this.presetService.findActivityPresets(eventDayId);
  }

  @Post('event-days/:eventDayId/activity-presets')
  createActivityPreset(@Param('eventDayId', ParseIntPipe) eventDayId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateEventDayActivityDto) {
    return this.presetService.createActivityPreset(eventDayId, dto);
  }

  @Post('event-days/:eventDayId/activity-presets/bulk')
  bulkCreateActivityPresets(@Param('eventDayId', ParseIntPipe) eventDayId: number, @Body(new ValidationPipe({ transform: true })) body: { presets: { name: string; color?: string; order_index?: number }[] }) {
    return this.presetService.bulkCreateActivityPresets(eventDayId, body.presets);
  }

  @Patch('activity-presets/:presetId')
  updateActivityPreset(@Param('presetId', ParseIntPipe) presetId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateEventDayActivityDto) {
    return this.presetService.updateActivityPreset(presetId, dto);
  }

  @Delete('activity-presets/:presetId')
  deleteActivityPreset(@Param('presetId', ParseIntPipe) presetId: number) {
    return this.presetService.deleteActivityPreset(presetId);
  }

  @Get('activity-presets/:presetId/moments')
  getPresetMoments(@Param('presetId', ParseIntPipe) presetId: number) {
    return this.presetService.findPresetMoments(presetId);
  }

  @Post('activity-presets/:presetId/moments')
  createPresetMoment(@Param('presetId', ParseIntPipe) presetId: number, @Body(new ValidationPipe({ transform: true })) dto: CreatePresetMomentDto) {
    return this.presetService.createPresetMoment(presetId, dto);
  }

  @Post('activity-presets/:presetId/moments/bulk')
  bulkCreatePresetMoments(@Param('presetId', ParseIntPipe) presetId: number, @Body(new ValidationPipe({ transform: true })) body: { moments: { name: string; duration_seconds?: number; order_index?: number; is_key_moment?: boolean }[] }) {
    return this.presetService.bulkCreatePresetMoments(presetId, body.moments);
  }

  @Patch('preset-moments/:momentId')
  updatePresetMoment(@Param('momentId', ParseIntPipe) momentId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdatePresetMomentDto) {
    return this.presetService.updatePresetMoment(momentId, dto);
  }

  @Delete('preset-moments/:momentId')
  deletePresetMoment(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.presetService.deletePresetMoment(momentId);
  }

  @Get('films/:filmId')
  getFilmSchedule(@Param('filmId', ParseIntPipe) filmId: number) {
    return this.filmService.getFilmSchedule(filmId);
  }

  @Post('films/:filmId/scenes')
  upsertFilmSceneSchedule(@Param('filmId', ParseIntPipe) filmId: number, @Body(new ValidationPipe({ transform: true })) dto: CreateFilmSceneScheduleDto) {
    return this.filmService.upsertFilmSceneSchedule(filmId, dto);
  }

  @Post('films/:filmId/scenes/bulk')
  bulkUpsertFilmSceneSchedules(@Param('filmId', ParseIntPipe) filmId: number, @Body(new ValidationPipe({ transform: true })) schedules: BulkUpsertFilmSceneScheduleDto[]) {
    return this.filmService.bulkUpsertFilmSceneSchedules(filmId, schedules);
  }

  @Patch('films/scenes/:scheduleId')
  updateFilmSceneSchedule(@Param('scheduleId', ParseIntPipe) scheduleId: number, @Body(new ValidationPipe({ transform: true })) dto: UpdateFilmSceneScheduleDto) {
    return this.filmService.updateFilmSceneSchedule(scheduleId, dto);
  }

  @Delete('films/scenes/:scheduleId')
  deleteFilmSceneSchedule(@Param('scheduleId', ParseIntPipe) scheduleId: number) {
    return this.filmService.deleteFilmSceneSchedule(scheduleId);
  }
}
