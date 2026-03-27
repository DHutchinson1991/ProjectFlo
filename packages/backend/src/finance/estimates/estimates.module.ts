import { Module } from '@nestjs/common';
import { EstimatesService } from './estimates.service';
import { EstimateLifecycleService } from './services/estimate-lifecycle.service';
import { EstimateSnapshotService } from './services/estimate-snapshot.service';
import { EstimateAutoGenerationService } from './services/estimate-auto-generation.service';
import { EstimatesController } from './estimates.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { TasksModule } from '../../workflow/tasks/tasks.module';
import { ProjectsModule } from '../../workflow/projects/projects.module';
import { TaskLibraryModule } from '../../workflow/task-library/task-library.module';

@Module({
  imports: [PrismaModule, TasksModule, ProjectsModule, TaskLibraryModule],
  controllers: [EstimatesController],
  providers: [
    EstimatesService,
    EstimateLifecycleService,
    EstimateSnapshotService,
    EstimateAutoGenerationService,
  ],
  exports: [EstimatesService, EstimateLifecycleService],
})
export class EstimatesModule {}
