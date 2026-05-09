import { Module } from '@nestjs/common';
import { GemmaController } from './gemma.controller';
import { GemmaService } from './gemma.service';
import { SkillLoaderService } from './skill-loader.service';

@Module({
  controllers: [GemmaController],
  providers: [GemmaService, SkillLoaderService],
  exports: [GemmaService, SkillLoaderService],
})
export class GemmaModule {}
