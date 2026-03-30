import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { TasksModule } from '../../workflow/tasks/tasks.module';

// Legacy monolithic controller (frontend still calls these routes; to be removed once frontend migrates)
import { ScheduleController } from './schedule.controller';

// Split services (bounded responsibility)
import {
  SchedulePresetService,
  ScheduleFilmService,
  SchedulePackageService,
  SchedulePackageActivityService,
  SchedulePackageResourceService,
  ScheduleProjectService,
  ScheduleInstanceService,
  ScheduleInstanceResourceService,
  ScheduleInstanceCrewSlotsService,
  ScheduleDiffService,
} from './services';

// Split controllers (api/ prefixed, guarded)
import {
  SchedulePresetController,
  SchedulePackageController,
  SchedulePackageResourceController,
  ScheduleProjectController,
  ScheduleInstanceController,
  ScheduleInstanceResourceController,
} from './controllers';

@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [
    ScheduleController,
    SchedulePresetController,
    SchedulePackageController,
    SchedulePackageResourceController,
    ScheduleProjectController,
    ScheduleInstanceController,
    ScheduleInstanceResourceController,
  ],
  providers: [
    SchedulePresetService,
    ScheduleFilmService,
    SchedulePackageService,
    SchedulePackageActivityService,
    SchedulePackageResourceService,
    ScheduleProjectService,
    ScheduleInstanceService,
    ScheduleInstanceResourceService,
    ScheduleInstanceCrewSlotsService,
    ScheduleDiffService,
  ],
  exports: [
    ScheduleDiffService,
    ScheduleProjectService,
    ScheduleInstanceService,
    ScheduleInstanceCrewSlotsService,
  ],
})
export class ScheduleModule {}
