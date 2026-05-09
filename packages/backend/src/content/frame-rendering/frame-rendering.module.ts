import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { GemmaModule } from '../../ai/gemma/gemma.module';
import { ComfyUIModule } from '../../ai/comfyui/comfyui.module';
import { SpatialEngineModule } from '../spatial-engine/spatial-engine.module';
import { ScenePreparationModule } from '../scene-preparation/scene-preparation.module';
import { FrameRenderService } from './services/frame-render.service';
import { FrameCompositorService } from './services/frame-compositor.service';
import { PromptStylistService } from './services/prompt-stylist.service';
import { FrameRenderingController } from './frame-rendering.controller';

@Module({
  imports: [
    PrismaModule,
    GemmaModule,
    ComfyUIModule,
    SpatialEngineModule,
    ScenePreparationModule,
  ],
  controllers: [FrameRenderingController],
  providers: [
    FrameRenderService,
    FrameCompositorService,
    PromptStylistService,
  ],
  exports: [FrameRenderService],
})
export class FrameRenderingModule {}
