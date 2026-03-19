import { Module } from '@nestjs/common';
import { EstimatesService } from './estimates.service';
import { EstimatesController } from './estimates.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InquiryTasksModule } from '../inquiry-tasks/inquiry-tasks.module';
import { ProjectsModule } from '../projects/projects.module';
import { TaskLibraryModule } from '../business/task-library/task-library.module';

@Module({
  imports: [PrismaModule, InquiryTasksModule, ProjectsModule, TaskLibraryModule],
  controllers: [EstimatesController],
  providers: [EstimatesService],
  exports: [EstimatesService],
})
export class EstimatesModule { }
