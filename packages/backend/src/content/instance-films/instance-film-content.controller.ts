import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShotType } from '@prisma/client';
import { InstanceMomentService } from './services/instance-moment.service';
import { InstanceBeatService } from './services/instance-beat.service';
import {
  CreateInstanceMomentDto,
  UpdateInstanceMomentDto,
  CreateInstanceBeatDto,
  UpdateInstanceBeatDto,
} from './dto';

/**
 * Handles moments, beats, and their recording setups.
 */
@Controller('api/instance-films')
@UseGuards(AuthGuard('jwt'))
export class InstanceFilmContentController {
  constructor(
    private readonly momentService: InstanceMomentService,
    private readonly beatService: InstanceBeatService,
  ) {}

  // ── Moments ───────────────────────────────────────────────────────

  @Post('scenes/:sceneId/moments')
  createMoment(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body(ValidationPipe) dto: CreateInstanceMomentDto,
  ) {
    return this.momentService.createMoment(sceneId, dto);
  }

  @Get('scenes/:sceneId/moments')
  findAllMoments(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.momentService.findAllMoments(sceneId);
  }

  @Get('moments/:momentId')
  findOneMoment(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.momentService.findOneMoment(momentId);
  }

  @Patch('moments/:momentId')
  updateMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body(ValidationPipe) dto: UpdateInstanceMomentDto,
  ) {
    return this.momentService.updateMoment(momentId, dto);
  }

  @Delete('moments/:momentId')
  removeMoment(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.momentService.removeMoment(momentId);
  }

  @Post('scenes/:sceneId/moments/reorder')
  reorderMoments(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body(new ValidationPipe({ transform: true })) orderings: Array<{ id: number; order_index: number }>,
  ) {
    return this.momentService.reorderMoments(sceneId, orderings);
  }

  // ── Moment Recording Setup ────────────────────────────────────────

  @Get('moments/:momentId/recording-setup')
  getMomentRecordingSetup(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.momentService.getMomentRecordingSetup(momentId);
  }

  @Patch('moments/:momentId/recording-setup')
  upsertMomentRecordingSetup(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body(new ValidationPipe({ transform: true }))
    data: {
      camera_assignments?: Array<{
        track_id: number;
        subject_ids?: number[];
        shot_type?: ShotType | null;
      }>;
      audio_track_ids?: number[];
      graphics_enabled?: boolean;
      graphics_title?: string | null;
    },
  ) {
    return this.momentService.upsertMomentRecordingSetup(momentId, data);
  }

  @Delete('moments/:momentId/recording-setup')
  deleteMomentRecordingSetup(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.momentService.deleteMomentRecordingSetup(momentId);
  }

  // ── Beats ─────────────────────────────────────────────────────────

  @Post('scenes/:sceneId/beats')
  createBeat(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceBeatDto,
  ) {
    return this.beatService.createBeat(sceneId, dto);
  }

  @Get('scenes/:sceneId/beats')
  findAllBeats(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.beatService.findAllBeats(sceneId);
  }

  @Get('beats/:beatId')
  findOneBeat(@Param('beatId', ParseIntPipe) beatId: number) {
    return this.beatService.findOneBeat(beatId);
  }

  @Patch('beats/:beatId')
  updateBeat(
    @Param('beatId', ParseIntPipe) beatId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateInstanceBeatDto,
  ) {
    return this.beatService.updateBeat(beatId, dto);
  }

  @Delete('beats/:beatId')
  removeBeat(@Param('beatId', ParseIntPipe) beatId: number) {
    return this.beatService.removeBeat(beatId);
  }

  // ── Beat Recording Setup ──────────────────────────────────────────

  @Get('beats/:beatId/recording-setup')
  getBeatRecordingSetup(@Param('beatId', ParseIntPipe) beatId: number) {
    return this.beatService.getBeatRecordingSetup(beatId);
  }

  @Patch('beats/:beatId/recording-setup')
  upsertBeatRecordingSetup(
    @Param('beatId', ParseIntPipe) beatId: number,
    @Body(new ValidationPipe({ transform: true })) data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean },
  ) {
    return this.beatService.upsertBeatRecordingSetup(beatId, data);
  }

  @Delete('beats/:beatId/recording-setup')
  deleteBeatRecordingSetup(@Param('beatId', ParseIntPipe) beatId: number) {
    return this.beatService.deleteBeatRecordingSetup(beatId);
  }
}
