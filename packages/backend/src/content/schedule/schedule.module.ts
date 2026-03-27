import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { TasksModule } from '../../workflow/tasks/tasks.module';

// Legacy monolithic controller + service (to be removed once frontend migrates to api/ routes)
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

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
    ScheduleService,
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
    ScheduleService,
    ScheduleDiffService,
    ScheduleProjectService,
    ScheduleInstanceService,
    ScheduleInstanceCrewSlotsService,
  ],
})
export class ScheduleModule {}
