import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateInstanceSceneDto, UpdateInstanceSceneDto } from './dto';
import { InstanceSceneService } from './services/instance-scene.service';

/**
 * Handles scene CRUD, reorder, and scene-level recording setup.
 */
@Controller('api/instance-films')
@UseGuards(AuthGuard('jwt'))
export class InstanceFilmSceneController {
  constructor(private readonly sceneService: InstanceSceneService) {}

  @Post(':projectFilmId/scenes')
  createScene(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body(ValidationPipe) dto: CreateInstanceSceneDto,
  ) {
    return this.sceneService.createScene(projectFilmId, dto);
  }

  @Get(':projectFilmId/scenes')
  findAllScenes(@Param('projectFilmId', ParseIntPipe) projectFilmId: number) {
    return this.sceneService.findAllScenes(projectFilmId);
  }

  @Get('scenes/:sceneId')
  findOneScene(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.sceneService.findOneScene(sceneId);
  }

  @Patch('scenes/:sceneId')
  updateScene(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body(ValidationPipe) dto: UpdateInstanceSceneDto,
  ) {
    return this.sceneService.updateScene(sceneId, dto);
  }

  @Delete('scenes/:sceneId')
  @HttpCode(HttpStatus.OK)
  removeScene(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.sceneService.removeScene(sceneId);
  }

  @Post(':projectFilmId/scenes/reorder')
  reorderScenes(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body(new ValidationPipe({ transform: true })) orderings: Array<{ id: number; order_index: number }>,
  ) {
    return this.sceneService.reorderScenes(projectFilmId, orderings);
  }

  // ── Scene Recording Setup ─────────────────────────────────────────

  @Get('scenes/:sceneId/recording-setup')
  getSceneRecordingSetup(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.sceneService.getSceneRecordingSetup(sceneId);
  }

  @Patch('scenes/:sceneId/recording-setup')
  upsertSceneRecordingSetup(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body(new ValidationPipe({ transform: true })) data: { audio_track_ids?: number[]; graphics_enabled?: boolean },
  ) {
    return this.sceneService.upsertSceneRecordingSetup(sceneId, data);
  }

  @Delete('scenes/:sceneId/recording-setup')
  deleteSceneRecordingSetup(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.sceneService.deleteSceneRecordingSetup(sceneId);
  }
}
