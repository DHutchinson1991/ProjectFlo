import { Controller, Post, Body, ValidationPipe, Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GenerateBlockingDto } from './dto/generate-blocking.dto';
import { GenerateSceneBlockingDto } from './dto/generate-scene-blocking.dto';
import { SceneOrchestrationService } from '../orchestration/scene-orchestration.service';

@Controller('api/ai/blocking')
@UseGuards(AuthGuard('jwt'))
export class BlockingDirectorController {
  private readonly logger = new Logger(BlockingDirectorController.name);

  constructor(private readonly orchestration: SceneOrchestrationService) {}

  @Post('generate-moment')
  async generateMomentBlocking(
    @Body(ValidationPipe) dto: GenerateBlockingDto,
  ) {
    this.logger.log(`Generating blocking for scene moment ${dto.sceneMomentId}, slot ${dto.spaceSlotId}`);
    return this.orchestration.runBlockingPipeline(
      dto.sceneMomentId,
      dto.spaceSlotId,
      dto.activityId,
    );
  }

  @Post('generate-scene')
  async generateSceneBlocking(
    @Body(ValidationPipe) dto: GenerateSceneBlockingDto,
  ) {
    this.logger.log(
      `Generating blocking for film scene ${dto.filmSceneId}, slot ${dto.spaceSlotId}`,
    );
    return this.orchestration.runSceneBlockingPipeline(
      dto.filmSceneId,
      dto.spaceSlotId,
      dto.activityId,
    );
  }
}
