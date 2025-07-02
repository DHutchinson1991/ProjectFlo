import { Module } from '@nestjs/common';
import { TaskTemplatesService } from './taskTemplates.service';
import { TaskTemplatesController } from './taskTemplates.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaskTemplatesController],
  providers: [TaskTemplatesService],
  exports: [TaskTemplatesService],
})
export class TaskTemplatesModule { }
