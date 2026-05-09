import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { BlockingModule } from '../blocking/blocking.module';
import { FrameRenderingModule } from '../../content/frame-rendering/frame-rendering.module';
import { SceneOrchestrationService } from './scene-orchestration.service';
import { NarrativeAnalystStep } from './steps/narrative-analyst.step';
import { BlockingDirectorController } from '../blocking/blocking-director.controller';

@Module({
  imports: [
    PrismaModule,
    BlockingModule,
    forwardRef(() => FrameRenderingModule),
  ],
  controllers: [BlockingDirectorController],
  providers: [
    SceneOrchestrationService,
    NarrativeAnalystStep,
  ],
  exports: [SceneOrchestrationService],
})
export class OrchestrationModule {}
