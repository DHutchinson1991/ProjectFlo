import { Module } from '@nestjs/common';
import { SceneAudioSourcesService } from './scene-audio-sources.service';
import { SceneAudioSourcesController } from './scene-audio-sources.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SceneAudioSourcesController],
    providers: [SceneAudioSourcesService],
    exports: [SceneAudioSourcesService],
})
export class SceneAudioSourcesModule {}
