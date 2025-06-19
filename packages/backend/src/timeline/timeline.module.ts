import { Module } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TimelineController],
  providers: [TimelineService, PrismaService],
  exports: [TimelineService],
})
export class TimelineModule {}
