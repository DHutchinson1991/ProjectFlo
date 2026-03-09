import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectPackageCloneService } from './project-package-clone.service';
import { ProjectPackageSnapshotService } from './project-package-snapshot.service';
import { ProjectFilmCloneService } from './project-film-clone.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '../content/schedule/schedule.module';

@Module({
    imports: [PrismaModule, ScheduleModule],
    controllers: [ProjectsController],
    providers: [ProjectsService, ProjectPackageCloneService, ProjectPackageSnapshotService, ProjectFilmCloneService],
    exports: [ProjectsService, ProjectPackageCloneService, ProjectPackageSnapshotService, ProjectFilmCloneService],
})
export class ProjectsModule { }
