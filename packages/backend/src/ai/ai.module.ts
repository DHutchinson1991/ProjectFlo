import { Module } from '@nestjs/common';
import { GemmaModule } from './gemma/gemma.module';
import { BlockingModule } from './blocking/blocking.module';
import { OrchestrationModule } from './orchestration/scene-orchestration.module';
import { ComfyUIModule } from './comfyui/comfyui.module';

@Module({
  imports: [GemmaModule, BlockingModule, OrchestrationModule, ComfyUIModule],
})
export class AiModule {}
