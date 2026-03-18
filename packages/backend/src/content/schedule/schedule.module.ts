import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { InquiryTasksModule } from '../../inquiry-tasks/inquiry-tasks.module';

@Module({
  imports: [PrismaModule, InquiryTasksModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
