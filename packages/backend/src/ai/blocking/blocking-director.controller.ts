import { Controller, Post, Body, ValidationPipe, Logger } from '@nestjs/common';
import { GenerateBlockingDto } from './dto/generate-blocking.dto';
import { SceneOrchestrationService } from '../orchestration/scene-orchestration.service';

@Controller('api/ai/blocking')
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
}
