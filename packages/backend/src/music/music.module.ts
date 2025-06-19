import { Module } from '@nestjs/common';
import { MusicService } from './music.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [MusicService, PrismaService],
  exports: [MusicService],
})
export class MusicModule {}
