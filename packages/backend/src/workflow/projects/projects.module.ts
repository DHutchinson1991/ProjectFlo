import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectQueryService } from './project-query.service';
import { ProjectPackageCloneService } from './project-package-clone.service';
import { ProjectPackageSnapshotService } from './project-package-snapshot.service';
import { ProjectSnapshotSummaryService } from './project-snapshot-summary.service';
import { ProjectSnapshotScheduleService } from './project-snapshot-schedule.service';
import { ProjectSnapshotCrewService } from './project-snapshot-crew.service';
import { ProjectPackagePrefillService } from './project-package-prefill.service';
import { ProjectPackageSyncService } from './project-package-sync.service';
import { ProjectTaskReassignService } from './project-task-reassign.service';
import { ProjectFilmCloneService } from './project-film-clone.service';
import { ProjectFilmSceneCloneService } from './project-film-scene-clone.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { ScheduleModule } from '../../content/schedule/schedule.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
    imports: [PrismaModule, ScheduleModule, LocationsModule],
    controllers: [ProjectsController],
    providers: [ProjectsService, ProjectQueryService, ProjectPackageCloneService, ProjectPackageSnapshotService, ProjectSnapshotSummaryService, ProjectSnapshotScheduleService, ProjectSnapshotCrewService, ProjectPackagePrefillService, ProjectPackageSyncService, ProjectTaskReassignService, ProjectFilmCloneService, ProjectFilmSceneCloneService],
    exports: [ProjectsService, ProjectQueryService, ProjectPackageCloneService, ProjectPackageSnapshotService, ProjectPackageSyncService, ProjectFilmCloneService, ProjectFilmSceneCloneService],
})
export class ProjectsModule { }
