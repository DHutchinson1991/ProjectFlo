import { Module } from '@nestjs/common';
import { MusicService } from './music.service';
import { MusicController } from './music.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MusicController],
    providers: [MusicService],
    exports: [MusicService],
})
export class MusicModule { }
