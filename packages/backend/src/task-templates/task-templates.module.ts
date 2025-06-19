import { Module } from '@nestjs/common';
import { TaskTemplatesService } from './task-templates.service';
import { TaskTemplatesController } from './task-templates.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TaskTemplatesController],
  providers: [TaskTemplatesService, PrismaService],
  exports: [TaskTemplatesService],
})
export class TaskTemplatesModule {}
